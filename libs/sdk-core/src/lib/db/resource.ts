import type { Observable } from 'rxjs';
import { catchError, forkJoin, map, of } from 'rxjs';
import type { UploadResponse } from './upload';
import { batchUpload, FileMetadata, FileWithMetadata, upload, UploadStatus } from './upload';
import type { INuclia } from '../models';
import type {
  CloudLink,
  ExtractedText,
  FIELD_TYPE,
  FileField,
  FileFieldData,
  ICreateResource,
  IFieldData,
  IResource,
  KeywordSetField,
  LinkField,
  LinkFieldData,
  ResourceData,
  ResourceField,
  TextField,
} from './resource.models';
import type { Search } from './search.models';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Resource extends IResource {}
export class Resource implements IResource {
  kb: string;
  uuid: string;
  private nuclia: INuclia;
  data: ResourceData = {};

  get path(): string {
    return `/kb/${this.kb}/resource/${this.uuid}`;
  }

  constructor(nuclia: INuclia, kb: string, uuid: string, data: IResource) {
    this.nuclia = nuclia;
    this.kb = kb;
    this.uuid = uuid;
    Object.assign(this, { ...data, title: this.formatTitle(data.title) });
  }

  modify(data: Partial<ICreateResource>, synchronous = true): Observable<void> {
    return this.nuclia.rest.patch<void>(this.path, data, undefined, undefined, synchronous);
  }

  delete(synchronous = true): Observable<void> {
    return this.nuclia.rest.delete(this.path, undefined, synchronous);
  }

  reprocess(): Observable<void> {
    return this.nuclia.rest.post<void>(`${this.path}/reprocess`, {});
  }

  getField(type: FIELD_TYPE, field: string): Observable<ResourceField> {
    return this.nuclia.rest.get<ResourceField>(`${this.path}/${type}/${field}`);
  }

  getFields(types: (keyof ResourceData)[] = ['files', 'links', 'texts', 'keywordsets']): IFieldData[] {
    return Object.entries(this.data)
      .filter(([key, value]) => types.includes(key as keyof ResourceData))
      .map(([key, value]) => value)
      .filter((obj) => !!obj)
      .map((obj) => Object.values(obj!) as IFieldData[])
      .reduce((acc, val) => acc.concat(val), [] as IFieldData[]);
  }

  getExtractedSummaries(): string[] {
    return this.getFields()
      .filter((field) => field.extracted?.metadata?.metadata?.summary)
      .map((field) => field.extracted!.metadata!.metadata!.summary!);
  }

  getExtractedTexts(): ExtractedText[] {
    return this.getFields()
      .filter((field) => field.extracted?.text)
      .map((field) => field.extracted!.text!);
  }

  getFiles(): CloudLink[] {
    return this.getFields(['files'])
      .filter((field) => !!field && !!field.value)
      .map((field) => (field as FileFieldData)!.value!.file!);
  }

  getThumbnails(): CloudLink[] {
    return this.getFields(['files'])
      .map((field) => {
        const fileField = field as FileFieldData;
        let thumbnail: CloudLink | undefined = fileField.extracted?.file?.file_thumbnail;
        if (!thumbnail && fileField.value?.file?.content_type?.startsWith('image')) {
          thumbnail = fileField.value?.file;
        }
        return thumbnail;
      })
      .concat(this.getFields(['links']).map((field) => (field as LinkFieldData).extracted?.link?.link_thumbnail))
      .filter((thumb) => !!thumb) as CloudLink[];
  }

  getThumbnailsUrl(): Observable<string[]> {
    return forkJoin(
      this.getThumbnails()
        .filter((cloudLink) => cloudLink.uri)
        .map((cloudLink) => this.nuclia.rest.getObjectURL(cloudLink.uri as string)),
    );
  }

  getNamedEntities(): { [key: string]: string[] } {
    return this.getFields()
      .filter((field) => field.extracted?.metadata?.metadata?.ner)
      .map((field) =>
        Object.entries(field.extracted!.metadata!.metadata!.ner).reduce((acc, [key, value]) => {
          acc[value] = (acc[value] || []).concat([key]);
          return acc;
        }, {} as { [key: string]: string[] }),
      )
      .reduce((acc, val) => {
        Object.entries(val).forEach(([key, value]) => {
          acc[key] = (acc[key] || []).concat(value);
        });
        return acc;
      }, {});
  }

  deleteField(type: FIELD_TYPE, field: string): Observable<void> {
    return this.nuclia.rest.delete(`${this.path}/${type}/${field}`);
  }

  addField(
    type: FIELD_TYPE,
    field: string,
    data: TextField | LinkField | FileField | KeywordSetField,
  ): Observable<void> {
    return this.nuclia.rest.put(`${this.path}/${type}/${field}`, data);
  }

  upload(field: string, file: File, TUS?: boolean, metadata?: FileMetadata): Observable<UploadResponse>;
  upload(field: string, buffer: ArrayBuffer, TUS?: boolean, metadata?: FileMetadata): Observable<UploadResponse>;
  upload(
    field: string,
    data: File | FileWithMetadata | ArrayBuffer,
    TUS?: boolean,
    metadata?: FileMetadata,
  ): Observable<UploadResponse> {
    return upload(this.nuclia, `${this.path}/file/${field}`, data, !!TUS, metadata);
  }

  batchUpload(files: FileList | File[]): Observable<UploadStatus> {
    return batchUpload(this.nuclia, this.path, files, true);
  }

  search(query: string, features: Search.ResourceFeatures[] = [], highlight = false): Observable<Search.Results> {
    const params = [`query=${encodeURIComponent(query)}`, ...features.map((f) => `features=${f}`)];
    if (highlight) {
      params.push(`highlight=true&split=true`);
    }
    return this.nuclia.rest.get<Search.Results>(`${this.path}/search?${params.join('&')}`).pipe(
      catchError(() => of({ error: true } as Search.Results)),
      map((res) =>
        Object.keys(res).includes('detail') ? ({ error: true } as Search.Results) : (res as Search.Results),
      ),
    );
  }

  private formatTitle(title?: string): string {
    title = title || '–';
    try {
      return decodeURIComponent(title);
    } catch (e) {
      return title;
    }
  }
}
