import type { Observable } from 'rxjs';
import { catchError, forkJoin, map, of } from 'rxjs';
import type { UploadResponse } from './upload';
import { batchUpload, FileMetadata, FileWithMetadata, upload, UploadStatus } from './upload';
import type { INuclia } from '../models';
import type {
  Classification,
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
  TokenAnnotation,
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

  getFields<T = IFieldData>(types: (keyof ResourceData)[] = ['files', 'links', 'texts', 'keywordsets']): T[] {
    return Object.entries(this.data)
      .filter(([key, value]) => types.includes(key as keyof ResourceData))
      .map(([key, value]) => value)
      .filter((obj) => !!obj)
      .map((obj) => Object.values(obj!) as T[])
      .reduce((acc, val) => acc.concat(val), [] as T[]);
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
    return this.getFields<FileFieldData>(['files'])
      .filter((field) => !!field && !!field.value && !!field.value.file)
      .map((field) => (field.value as FileField).file as CloudLink);
  }

  getThumbnails(): CloudLink[] {
    return this.getFields<FileFieldData>(['files'])
      .map((field) => field.extracted?.file?.file_thumbnail)
      .concat(this.getFields<LinkFieldData>(['links']).map((field) => field.extracted?.link?.link_thumbnail))
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

  setLabels(
    fieldId: string,
    fieldType: string,
    paragraphId: string,
    labels: Classification[],
    preserve = true,
  ): Observable<void> {
    const fieldmetadata = preserve && this.fieldmetadata ? [...this.fieldmetadata] : [];
    fieldmetadata.push({
      field: {
        field: fieldId,
        field_type: fieldType,
      },
      paragraphs: [
        {
          key: paragraphId,
          classifications: labels,
        },
      ],
    });
    return this.modify({ fieldmetadata });
  }

  setEntities(fieldId: string, fieldType: string, entities: TokenAnnotation[], preserve = true): Observable<void> {
    const fieldmetadata = preserve && this.fieldmetadata ? [...this.fieldmetadata] : [];
    fieldmetadata.push({
      field: {
        field: fieldId,
        field_type: fieldType,
      },
      token: entities,
    });
    return this.modify({ fieldmetadata });
  }

  addEntity(fieldId: string, fieldType: string, entity: TokenAnnotation): Observable<void> {
    const existingEntities = this.fieldmetadata?.find((metadata) => metadata.field.field === fieldId)?.token || [];
    return this.setEntities(fieldId, fieldType, [...existingEntities, entity]);
  }

  removeEntity(fieldId: string, fieldType: string, entity: TokenAnnotation): Observable<void> {
    const existingEntities = this.fieldmetadata?.find((metadata) => metadata.field.field === fieldId)?.token || [];
    return this.setEntities(
      fieldId,
      fieldType,
      existingEntities.filter((e) => e.klass !== entity.klass || e.token !== entity.token),
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
