import { forkJoin, Observable, tap } from 'rxjs';
import type { UploadResponse } from '../upload';
import { batchUpload, FileMetadata, FileWithMetadata, upload, UploadStatus } from '../upload';
import type { IErrorResponse, INuclia } from '../../models';
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
  Paragraph,
  PositionedNER,
  ResourceData,
  ResourceField,
  Sentence,
  TextField,
  TokenAnnotation,
  UserTokenAnnotation,
} from './resource.models';
import type { Search, SearchOptions } from '../search';
import { search } from '../search';
import { setEntities, setLabels, sliceUnicode } from './resource.helpers';
import { ExtractedDataTypes, ResourceFieldProperties } from '../kb';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ReadableResource extends IResource {}
export class ReadableResource implements IResource {
  data: ResourceData = {};
  private fieldTextsCache: { [key: string]: string[] } = {};

  constructor(data: IResource) {
    if (!data.data) {
      data.data = {};
    }
    Object.assign(this, { ...data, title: this.formatTitle(data.title) });
  }

  getFields<T = IFieldData>(types: (keyof ResourceData)[] = ['files', 'links', 'texts', 'keywordsets']): T[] {
    return Object.entries(this.data)
      .filter(([key]) => types.includes(key as keyof ResourceData))
      .map(([, value]) => value)
      .filter((obj) => !!obj)
      .map((obj) => Object.values(obj!) as T[])
      .reduce((acc, val) => acc.concat(val), [] as T[]);
  }

  getFieldData<T = IFieldData>(type: keyof ResourceData, fieldId: string): T | undefined {
    const field = this.data[type]?.[fieldId];
    return field ? (field as T) : undefined;
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

  getAnnotatedEntities(): { [key: string]: string[] } {
    const entities = (this.fieldmetadata || [])
      .filter((entry) => entry.token && entry.token.length > 0)
      .map((entry) => entry.token as UserTokenAnnotation[]);
    return entities.reduce((acc, val) => {
      val
        .filter((token) => !token.cancelled_by_user)
        .forEach((token) => {
          if (!acc[token.klass]) {
            acc[token.klass] = [];
          }
          acc[token.klass].push(token.token);
        });
      return acc;
    }, {} as { [key: string]: string[] });
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

  getClassifications(): Classification[] {
    const classifications = (this.usermetadata?.classifications || []).filter((c) => !c.cancelled_by_user);
    const cancellations = (this.usermetadata?.classifications || []).filter((c) => c.cancelled_by_user);
    return (this.computedmetadata?.field_classifications || []).reduce((acc, field) => {
      field.classifications.forEach((classification) => {
        const existing = acc.find((c) => c.label === classification.label && c.labelset === classification.labelset);
        const isCancelled = cancellations.find(
          (c) => c.label === classification.label && c.labelset === classification.labelset,
        );
        if (!existing && !isCancelled) {
          acc.push({ ...classification, immutable: true });
        }
      });
      return acc;
    }, classifications);
  }

  getPositionedNamedEntities(fieldType: keyof ResourceData, fieldId: string): PositionedNER[] {
    const positions = this.data[fieldType]?.[fieldId]?.extracted?.metadata?.metadata.positions;
    if (!positions) {
      return [];
    }
    return Object.entries(positions).reduce((acc, [entityId, data]) => {
      const family = entityId.split('/')[0];
      data.position.forEach((position) => {
        acc.push({ entity: data.entity, family, ...position });
      });
      return acc;
    }, [] as PositionedNER[]);
  }

  private formatTitle(title?: string): string {
    title = title || '–';
    try {
      return decodeURIComponent(title);
    } catch (e) {
      return title;
    }
  }

  getParagraphText(fieldType: FIELD_TYPE, fieldId: string, paragraph: Paragraph): string {
    return sliceUnicode(this.getFieldText(fieldType, fieldId), paragraph.start, paragraph.end);
  }

  getSentenceText(fieldType: FIELD_TYPE, fieldId: string, sentence: Sentence): string {
    return sliceUnicode(this.getFieldText(fieldType, fieldId), sentence.start, sentence.end);
  }

  private getFieldText(fieldType: FIELD_TYPE, fieldId: string): string[] {
    const key = `${fieldType}-${fieldId}`;
    if (!this.fieldTextsCache[key]) {
      const field = this.getFieldData(`${fieldType}s` as keyof ResourceData, fieldId);
      this.fieldTextsCache[key] = Array.from(field?.extracted?.text?.text || '');
    }
    return this.fieldTextsCache[key];
  }
}

export class Resource extends ReadableResource implements IResource {
  kb: string;
  uuid: string;
  private nuclia: INuclia;

  get path(): string {
    if (!this.uuid && !this.slug) {
      throw new Error('Resource must have either uuid or slug');
    }
    return !this.uuid ? `/kb/${this.kb}/slug/${this.slug}` : `/kb/${this.kb}/resource/${this.uuid}`;
  }

  constructor(nuclia: INuclia, kb: string, data: IResource) {
    super(data);
    this.nuclia = nuclia;
    this.kb = kb;
    this.uuid = data.id;
  }

  modify(data: Partial<ICreateResource>, synchronous = true): Observable<void> {
    return this.nuclia.rest.patch<void>(this.path, data, undefined, undefined, synchronous);
  }

  delete(synchronous = true): Observable<void> {
    return this.nuclia.rest.delete(this.path, undefined, synchronous);
  }

  reprocess(): Observable<void> {
    return this.nuclia.rest.post<void>(`${this.path}/reprocess`, {}, undefined, undefined, true);
  }

  getField(
    type: FIELD_TYPE,
    field: string,
    show: ResourceFieldProperties[] = [ResourceFieldProperties.VALUE],
    extracted: ExtractedDataTypes[] = [
      ExtractedDataTypes.TEXT,
      ExtractedDataTypes.SHORTENED_METADATA,
      ExtractedDataTypes.LINK,
      ExtractedDataTypes.FILE,
    ],
  ): Observable<ResourceField> {
    const params = [...show.map((s) => `show=${s}`), ...extracted.map((e) => `extracted=${e}`)];
    return this.nuclia.rest.get<ResourceField>(`${this.path}/${type}/${field}?${params.join('&')}`);
  }

  getThumbnailsUrl(): Observable<string[]> {
    return forkJoin(
      this.getThumbnails()
        .filter((cloudLink) => cloudLink.uri)
        .map((cloudLink) => this.nuclia.rest.getObjectURL(cloudLink.uri as string)),
    );
  }

  deleteField(type: FIELD_TYPE, field: string): Observable<void> {
    return this.nuclia.rest.delete(`${this.path}/${type}/${field}`);
  }

  setField(
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

  search(
    query: string,
    features: Search.ResourceFeatures[] = [],
    options?: SearchOptions,
  ): Observable<Search.Results | IErrorResponse> {
    return search(this.nuclia, this.kb, this.path, query, features, options, true);
  }

  setLabels(fieldId: string, fieldType: string, paragraphId: string, labels: Classification[]): Observable<void> {
    const fieldmetadata = setLabels(fieldId, fieldType, paragraphId, labels, this.fieldmetadata || []);
    return this.modify({ fieldmetadata }).pipe(tap(() => (this.fieldmetadata = fieldmetadata)));
  }

  setEntities(fieldId: string, fieldType: string, entities: TokenAnnotation[]): Observable<void> {
    const fieldmetadata = setEntities(fieldId, fieldType, entities, this.fieldmetadata || []);
    return this.modify({ fieldmetadata }).pipe(tap(() => (this.fieldmetadata = fieldmetadata)));
  }
}
