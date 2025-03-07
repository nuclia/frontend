import {
  catchError,
  concatMap,
  filter,
  from,
  map,
  merge,
  mergeMap,
  Observable,
  of,
  range,
  retry,
  RetryConfig,
  startWith,
  switchMap,
} from 'rxjs';
import type { INuclia } from '../models';
import { ICreateResource } from './resource/resource.models';
import { retry429Config } from './resource/resource.helpers';

const CHUNK_SIZE = 5 * 1024 * 1024; // minimum size accepted by Amazon S3
const SLUGIFY = new RegExp(/[^a-z0-9_-]/g);

export interface UploadResponse {
  resource?: string;
  field?: string;
  progress?: number;
  failed?: boolean;
  completed?: boolean;
  conflict?: boolean;
  limitExceeded?: boolean;
  blocked?: boolean;
}

export interface UploadStatus {
  files: FileUploadStatus[];
  progress: number;
  completed: boolean;
  uploaded: number;
  failed: number;
  conflicts?: number;
  limitExceeded?: number;
  blocked?: number;
}

export interface FileUploadStatus {
  file: File;
  progress: number;
  uploaded: boolean;
  failed: boolean;
  conflicts?: boolean;
  limitExceeded?: boolean;
  blocked?: boolean;
}

export interface FileWithMetadata extends File {
  lang?: string;
  md5?: string;
  payload?: ICreateResource;
  contentType?: string;
  processing?: string;
}

export interface FileMetadata {
  lang?: string;
  contentType?: string;
  filename?: string;
  md5?: string;
  rslug?: string;
  processing?: string;
}

const uploadRetryConfig: RetryConfig = {
  count: 3,
  delay: (error) => {
    if (error.status >= 500 && error.status <= 599) {
      return of(true);
    } else {
      throw error;
    }
  },
};

export const upload = (
  nuclia: INuclia,
  path: string,
  data: File | FileWithMetadata | ArrayBuffer,
  TUS: boolean,
  metadata: FileMetadata = {},
): Observable<UploadResponse> => {
  if (!metadata.contentType && !(data instanceof ArrayBuffer)) {
    metadata.contentType = (data as FileWithMetadata).contentType || (data?.type !== 'null' ? data?.type : undefined);
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
  const extract_strategy = (data as FileWithMetadata).payload?.processing_options?.extract_strategy;
  if (extract_strategy) {
    metadata.processing = extract_strategy;
  }
  if ((data as FileWithMetadata).processing) {
    metadata.processing = (data as FileWithMetadata).processing;
    // TUS is not supported for visual-llm processing
    TUS = false;
  }
  return (data instanceof ArrayBuffer ? of(data) : from(data.arrayBuffer())).pipe(
    switchMap((buff) =>
      TUS
        ? TUSuploadFile(nuclia, path, buff, metadata, (data as FileWithMetadata).payload)
        : uploadFile(nuclia, path, buff, metadata),
    ),
  );
};

export const uploadFile = (
  nuclia: INuclia,
  path: string,
  buffer: ArrayBuffer,
  metadata?: FileMetadata,
  maxWaitOn429 = 30000,
): Observable<UploadResponse> => {
  const headers: { [key: string]: string } = {
    'content-type': metadata?.contentType || 'application/octet-stream',
    ...getFileMetadata(metadata),
  };
  const slug = metadata?.rslug ? `?rslug=${metadata.rslug}` : '';
  return of(true).pipe(
    switchMap(() => nuclia.rest.post<Response>(`${path}/upload${slug}`, buffer, headers, true)),
    retry(retry429Config(maxWaitOn429)),
    retry(uploadRetryConfig),
    switchMap((res) => {
      try {
        switch (res.status) {
          case 201: {
            return from(res.json()).pipe(
              map((data) => ({
                resource: data.uuid || '',
                field: data.field_id || '',
                completed: true,
              })),
            );
          }
          case 409: {
            return of({ conflict: true });
          }
          default: {
            return of({ failed: true });
          }
        }
      } catch (e) {
        return of({ failed: true });
      }
    }),
    catchError((error) => of({ failed: true, limitExceeded: error.status === 429, blocked: error.status === 402 })),
  );
};

export const TUSuploadFile = (
  nuclia: INuclia,
  path: string,
  buffer: ArrayBuffer,
  metadata?: FileMetadata,
  creationPayload?: ICreateResource,
  maxWaitOn429 = 30000,
): Observable<UploadResponse> => {
  let i = 0;
  let count = 0;
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
  uploadMetadata.push(`content_type ${btoa(metadata?.contentType || 'application/octet-stream')}`);

  if (uploadMetadata.length > 0) {
    headers['upload-metadata'] = uploadMetadata.join(',');
  }
  if (metadata?.processing) {
    headers['x-extract-strategy'] = metadata.processing;
  }
  return of(true).pipe(
    switchMap(() => nuclia.rest.post<Response>(`${path}/tusupload`, creationPayload, headers, true)),
    retry(retry429Config(maxWaitOn429)),
    retry(uploadRetryConfig),
    catchError((error) => of(error)),
    concatMap((res) =>
      merge(
        of(res).pipe(
          filter((res) => res.status !== 201 || !res.headers.get('location')),
          map((res) => ({
            failed: true,
            conflict: res.status === 409,
            limitExceeded: res.status === 429,
            blocked: res.status === 402,
          })),
        ),
        of(res).pipe(
          filter((res) => res.status === 201 && !!res.headers.get('location')),
          map((res) => res.headers.get('location')!),
          concatMap((tusLocation) =>
            range(0, loops).pipe(
              concatMap(() => {
                const chunk = buffer.slice(i, i + CHUNK_SIZE);
                count += 1;
                return failed
                  ? of({ failed })
                  : of(true).pipe(
                      switchMap(() =>
                        nuclia.rest.patch<Response>(
                          tusLocation,
                          chunk,
                          {
                            'content-type': metadata?.contentType || 'application/octet-stream',
                            'upload-offset': `${i}`,
                            'content-length': `${chunk.byteLength}`,
                          },
                          true,
                        ),
                      ),
                      retry(retry429Config(maxWaitOn429)),
                      retry(uploadRetryConfig),
                      map((res) => {
                        if (res.status !== 200) {
                          failed = true;
                          return { failed };
                        } else {
                          i += CHUNK_SIZE;
                          return {
                            completed: count === loops,
                            progress: i >= totalLength ? 100 : Math.min(Math.floor((i / totalLength) * 100), 100),
                          };
                        }
                      }),
                      catchError(() => {
                        failed = true;
                        return of({ failed: true, limitExceeded: res.status === 429, blocked: res.status === 402 });
                      }),
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
    const lang = (file as FileWithMetadata).lang;
    if (lang) {
      const payload = (file as FileWithMetadata).payload || {};
      (file as FileWithMetadata).payload = { ...payload, metadata: { ...payload?.metadata, language: lang } };
    }
    return upload(nuclia, uploadPath, file, true, {}).pipe(
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
      if (res.status.limitExceeded) {
        fileStatus.limitExceeded = true;
      }
      if (res.status.blocked) {
        fileStatus.blocked = true;
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
      const limitExceeded = filesStatus.filter((item) => item.limitExceeded).length;
      const blocked = filesStatus.filter((item) => item.blocked).length;
      const uploaded = filesStatus.filter((item) => item.uploaded).length;
      const completed = filesStatus.filter((item) => !item.failed && !item.uploaded).length === 0;
      const progress = Math.round(
        (filesStatus.reduce((acc, status) => acc + (status.file.size * status.progress) / 100, 0) / totalSize) * 100,
      );
      return { files: filesStatus, progress, completed, uploaded, failed, conflicts, limitExceeded, blocked };
    }),
  );
};

export const uploadToProcess = (
  nuclia: INuclia,
  nuaKey: string,
  file: File,
  metadata?: FileMetadata,
): Observable<string> => {
  const headers = {
    'x-nuclia-nuakey': `Bearer ${nuaKey}`,
    'content-type': metadata?.contentType || 'application/octet-stream',
    ...getFileMetadata(metadata),
  };
  return nuclia.rest.post<string>('/processing/upload', file, headers);
};

export const getFileMetadata = (metadata: FileMetadata | undefined): { [key: string]: string } => {
  const headers: { [key: string]: string } = {};
  if (metadata?.filename) {
    headers['x-filename'] = encodeURIComponent(metadata.filename);
  }
  if (metadata?.md5) {
    headers['x-md5'] = metadata.md5;
  }
  if (metadata?.lang) {
    headers['x-language'] = metadata.lang;
  }
  if (metadata?.processing) {
    headers['x-extract-strategy'] = metadata.processing;
  }
  return headers;
};
