import {
  map,
  Observable,
  switchMap,
  range,
  filter,
  concatMap,
  from,
  of,
  merge,
  startWith,
  catchError,
  mergeMap,
  repeatWhen,
  take,
} from 'rxjs';
import type { INuclia } from '../models';
import { NUA_CLIENT, NUA_KEY } from './db.models';
import type { ICreateResource } from './resource.models';

const CHUNK_SIZE = 512 * 1024; // minimum size accepted by GCS
const SLUGIFY = new RegExp(/[^a-z0-9_-]/g);

export interface UploadResponse {
  resource?: string;
  field?: string;
  progress?: number;
  failed?: boolean;
  completed?: boolean;
  conflict?: boolean;
}

export interface UploadStatus {
  files: FileUploadStatus[];
  progress: number;
  completed: boolean;
  uploaded: number;
  failed: number;
  conflicts?: number;
}

export interface FileUploadStatus {
  file: File;
  progress: number;
  uploaded: boolean;
  failed: boolean;
  conflicts?: boolean;
}

export interface FileWithMetadata extends File {
  lang?: string;
  md5?: string;
}

export interface FileMetadata {
  lang?: string;
  contentType?: string;
  filename?: string;
  md5?: string;
}

export const upload = (
  nuclia: INuclia,
  path: string,
  data: File | FileWithMetadata | ArrayBuffer,
  TUS: boolean,
  metadata: FileMetadata = {},
  creationPayload?: ICreateResource,
): Observable<UploadResponse> => {
  if (!metadata.contentType && !(data instanceof ArrayBuffer)) {
    metadata.contentType = data?.type;
  }
  if (!metadata.filename && !(data instanceof ArrayBuffer)) {
    metadata.filename = data?.name;
  }
  if (!metadata.lang && !(data instanceof ArrayBuffer)) {
    metadata.lang = (data as FileWithMetadata).lang;
  }
  if (!metadata.md5 && !(data instanceof ArrayBuffer)) {
    metadata.md5 = (data as FileWithMetadata).md5;
  }
  return (data instanceof ArrayBuffer ? of(data) : from(data.arrayBuffer())).pipe(
    switchMap((buff) =>
      TUS ? TUSuploadFile(nuclia, path, buff, metadata, creationPayload) : uploadFile(nuclia, path, buff, metadata),
    ),
  );
};

export const uploadFile = (
  nuclia: INuclia,
  path: string,
  buffer: ArrayBuffer,
  metadata?: FileMetadata,
): Observable<UploadResponse> => {
  const headers: { [key: string]: string } = {
    'content-type': metadata?.contentType || 'application/octet-stream',
    ...getFileMetadata(metadata),
  };
  let retries = 1;
  return nuclia.rest.post<Response>(`${path}/upload`, buffer, headers).pipe(
    repeatWhen((obs) => obs),
    filter((res) => retries-- === 0 || res.status !== 503),
    take(1),
    map((res) => {
      switch (res.status) {
        case 201: {
          return {
            resource: res.headers.get('ndb-resource') || '',
            field: res.headers.get('ndb-field') || '',
            completed: true,
          };
        }
        case 409: {
          return { conflict: true };
        }
        default: {
          return { failed: true };
        }
      }
    }),
  );
};

export const TUSuploadFile = (
  nuclia: INuclia,
  path: string,
  buffer: ArrayBuffer,
  metadata?: FileMetadata,
  creationPayload?: ICreateResource,
): Observable<UploadResponse> => {
  let i = 0;
  let failed = false;
  const totalLength = buffer.byteLength;
  const loops = Math.ceil(totalLength / CHUNK_SIZE);
  const headers: { [key: string]: string } = {
    'upload-length': `${totalLength}`,
    'tus-resumable': '1.0.0',
  };
  const uploadMetadata: string[] = [];
  if (metadata?.filename) {
    uploadMetadata.push(`filename ${btoa(encodeURIComponent(metadata.filename))}`);
  }
  if (metadata?.lang) {
    uploadMetadata.push(`language ${btoa(metadata.lang)}`);
  }
  if (metadata?.md5) {
    uploadMetadata.push(`md5 ${btoa(metadata.md5)}`);
  }
  if (metadata?.contentType) {
    uploadMetadata.push(`content_type ${btoa(metadata.contentType)}`);
  }
  if (uploadMetadata.length > 0) {
    headers['upload-metadata'] = uploadMetadata.join(',');
  }
  let retries = 1;
  return nuclia.rest.post<Response>(`${path}/tusupload`, creationPayload, headers, true).pipe(
    repeatWhen((obs) => obs),
    filter((res) => retries-- === 0 || res.status !== 503),
    catchError((error) => of(error)),
    take(1),
    concatMap((res) =>
      merge(
        of(res).pipe(
          filter((res) => res.status !== 201 || !res.headers.get('location')),
          map((res) => (res.status === 409 ? { conflict: true, failed: true } : { failed: true })),
        ),
        of(res).pipe(
          filter((res) => res.status === 201 && !!res.headers.get('location')),
          map((res) => res.headers.get('location')!),
          concatMap((tusLocation) =>
            range(0, loops).pipe(
              concatMap(() => {
                const chunk = buffer.slice(i, i + CHUNK_SIZE);
                return failed
                  ? of({ failed })
                  : nuclia.rest
                      .patch<Response>(
                        tusLocation,
                        chunk,
                        {
                          'content-type': metadata?.contentType || 'application/octet-stream',
                          'upload-offset': `${i}`,
                          'content-length': `${chunk.byteLength}`,
                        },
                        true,
                      )
                      .pipe(
                        map((res) => {
                          if (res.status !== 200) {
                            failed = true;
                            return { failed };
                          } else {
                            i += CHUNK_SIZE;
                            return {
                              completed: i >= totalLength,
                              progress: i >= totalLength ? 100 : Math.min(Math.floor((i / totalLength) * 100), 100),
                            };
                          }
                        }),
                        catchError(() => of({ failed: true })),
                      );
              }),
            ),
          ),
        ),
      ),
    ),
  );
};

export const batchUpload = (
  nuclia: INuclia,
  path: string,
  files: FileList | File[] | FileWithMetadata[],
  isResource = false,
  creationPayload?: ICreateResource,
): Observable<UploadStatus> => {
  const fileList = Array.from(files);
  const totalSize = fileList.reduce((acc, file) => acc + (file.size || 0), 0);
  const fieldIds: string[] = [];
  const filesStatus: FileUploadStatus[] = fileList.map((file) => ({
    file,
    progress: 0,
    uploaded: false,
    failed: false,
  }));
  const uploadAll = fileList.map((file) => {
    let uploadPath = path;
    if (isResource) {
      let fieldId = file.name.toLowerCase().replace(SLUGIFY, '_');
      if (fieldIds.includes(fieldId)) {
        fieldId += '_' + fieldIds.filter((id) => id.startsWith(fieldId)).length;
      }
      fieldIds.push(fieldId);
      uploadPath = `${uploadPath}/file/${fieldId}`;
    }
    const payload: ICreateResource | undefined = (file as FileWithMetadata).lang
      ? { ...creationPayload, metadata: { ...creationPayload?.metadata, language: (file as FileWithMetadata).lang } }
      : creationPayload;
    return upload(nuclia, uploadPath, file, true, {}, payload).pipe(
      startWith({ progress: 0, completed: false } as UploadResponse),
      map((status) => ({ status, file: file })),
    );
  });
  return from(uploadAll).pipe(
    mergeMap((upload) => upload, 6), // restrict to 6 concurrent uploads
    map((res) => {
      const fileStatus = filesStatus.find((item) => item.file === res.file)!;
      if (res.status.failed) {
        fileStatus.failed = true;
      }
      if (res.status.conflict) {
        fileStatus.conflicts = true;
      }
      if (res.status.completed) {
        fileStatus.uploaded = true;
      }
      if (!res.status.failed && !res.status.conflict && !res.status.completed) {
        fileStatus.progress = res.status.progress || 0;
      } else {
        fileStatus.progress = 100;
      }
      const failed = filesStatus.filter((item) => item.failed).length;
      const conflicts = filesStatus.filter((item) => item.conflicts).length;
      const uploaded = filesStatus.filter((item) => item.uploaded).length;
      const completed = uploaded + failed === filesStatus.length;
      const progress = Math.round(
        (filesStatus.reduce((acc, status) => acc + (status.file.size * status.progress) / 100, 0) / totalSize) * 100,
      );
      return { files: filesStatus, progress, completed, uploaded, failed, conflicts };
    }),
  );
};

export const uploadToProcess = (nuclia: INuclia, file: File, metadata?: FileMetadata): Observable<string> => {
  const headers = {
    'x-stf-nuakey': `Bearer ${localStorage.getItem(NUA_KEY)}`,
    'content-type': metadata?.contentType || 'application/octet-stream',
    ...getFileMetadata(metadata),
  };
  return nuclia.rest.post<string>('/processing/upload', file, headers);
};

const getFileMetadata = (metadata: FileMetadata | undefined): { [key: string]: string } => {
  const headers: { [key: string]: string } = {};
  if (metadata?.filename) {
    headers['x-filename'] = btoa(encodeURIComponent(metadata.filename));
  }
  if (metadata?.md5) {
    headers['x-md5'] = btoa(encodeURIComponent(metadata.md5));
  }
  if (metadata?.lang) {
    headers['x-language'] = btoa(encodeURIComponent(metadata.lang));
  }
  return headers;
};
