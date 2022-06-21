import type { Observable } from 'rxjs';
import { upload, batchUpload, FileWithMetadata, FileMetadata, UploadStatus } from './upload';
import type { UploadResponse } from './upload';
import type { INuclia } from '../models';
import type {
  IResource,
  ExtractedText,
  IFieldData,
  FileFieldData,
  LinkFieldData,
  CloudLink,
  ResourceData,
  FIELD_TYPE,
  ResourceField,
  TextField,
  LinkField,
  FileField,
  KeywordSetField,
} from './resource.models';
import type { Search } from './search.models';
import { forkJoin } from 'rxjs';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Resource extends IResource {}
export class Resource implements IResource {
  kb: string;
  uuid: string;
  private nuclia: INuclia;
  data: ResourceData = {};

  constructor(nuclia: INuclia, kb: string, uuid: string, data: IResource) {
    this.nuclia = nuclia;
    this.kb = kb;
    this.uuid = uuid;
    Object.assign(this, { ...data, title: data.title ? decodeURIComponent(data.title) : '–' });
  }

  modify(data: Partial<IResource>): Observable<void> {
    return this.nuclia.rest.patch<void>(`/kb/${this.kb}/resource/${this.uuid}`, data);
  }

  delete(): Observable<void> {
    return this.nuclia.rest.delete(`/kb/${this.kb}/resource/${this.uuid}`);
  }

  reprocess(): Observable<void> {
    return this.nuclia.rest.post<void>(`/kb/${this.kb}/resource/${this.uuid}/reprocess`, {});
  }

  getField(type: FIELD_TYPE, field: string): Observable<ResourceField> {
    return this.nuclia.rest.get<ResourceField>(`/kb/${this.kb}/resource/${this.uuid}/${type}/${field}`);
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
      .map((field) => (field as FileFieldData).extracted?.file?.file_thumbnail)
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
    return this.nuclia.rest.delete(`/kb/${this.kb}/resource/${this.uuid}/${type}/${field}`);
  }

  addField(
    type: FIELD_TYPE,
    field: string,
    data: TextField | LinkField | FileField | KeywordSetField,
  ): Observable<void> {
    return this.nuclia.rest.put(`/kb/${this.kb}/resource/${this.uuid}/${type}/${field}`, data);
  }

  upload(field: string, file: File, TUS?: boolean, metadata?: FileMetadata): Observable<UploadResponse>;
  upload(field: string, buffer: ArrayBuffer, TUS?: boolean, metadata?: FileMetadata): Observable<UploadResponse>;
  upload(
    field: string,
    data: File | FileWithMetadata | ArrayBuffer,
    TUS?: boolean,
    metadata?: FileMetadata,
  ): Observable<UploadResponse> {
    return upload(this.nuclia, `/kb/${this.kb}/resource/${this.uuid}/file/${field}`, data, !!TUS, metadata);
  }

  batchUpload(files: FileList | File[]): Observable<UploadStatus> {
    return batchUpload(this.nuclia, `/kb/${this.kb}/resource/${this.uuid}`, files, true);
  }

  search(query: string, features: Search.ResourceFeatures[] = []): Observable<Search.Results> {
    const params = [`query=${encodeURIComponent(query)}`, ...features.map((f) => `features=${f}`)];
    return this.nuclia.rest.get<Search.Results>(`/kb/${this.kb}/resource/${this.uuid}/search?${params.join('&')}`);
  }
}
