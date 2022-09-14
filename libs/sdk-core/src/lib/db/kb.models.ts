import type { Observable } from 'rxjs';
import type { IResource, LinkField, UserMetadata } from './resource.models';
import type { FileMetadata, FileWithMetadata, UploadResponse, UploadStatus } from './upload';
import type { Search } from './search.models';
import type { Resource } from './resource';

export type KBStates = 'PUBLISHED' | 'PRIVATE';
export type KBRoles = 'SOWNER' | 'SCONTRIBUTOR' | 'SMEMBER';

export enum ResourceProperties {
  BASIC = 'basic',
  ORIGIN = 'origin',
  RELATIONS = 'relations',
  VALUES = 'values',
  EXTRACTED = 'extracted',
  ERRORS = 'errors',
}
export enum ExtractedDataTypes {
  TEXT = 'text',
  METADATA = 'metadata',
  LARGE_METADATA = 'large_metadata',
  VECTOR = 'vectors',
  LINK = 'link',
  FILE = 'file',
}

export enum LabelSetKind {
  RESOURCES = 'RESOURCES',
  PARAGRAPHS = 'PARAGRAPHS',
  SENTENCES = 'SENTENCES',
}

export enum EventType {
  VISITED = 'VISITED',
  MODIFIED = 'MODIFIED',
  DELETED = 'DELETED',
  NEW = 'NEW',
  STARTED = 'STARTED',
  STOPPED = 'STOPPED',
  SEARCH = 'SEARCH',
  PROCESSED = 'PROCESSED',
}

export interface IKnowledgeBoxCreation {
  id: string;
  slug?: string;
  title?: string;
  state?: KBStates;
  description?: string;
  zone: string;
}
export interface IKnowledgeBoxItem extends IKnowledgeBoxCreation {
  role_on_kb?: KBRoles;
}
export interface IKnowledgeBox extends IKnowledgeBoxCreation {
  get path(): string;
  get fullpath(): string;
  getEntities(): Observable<Entities>;
  getEntitiesGroup(groupId: string): Observable<EntitiesGroup>;
  getLabels(): Observable<Labels>;
  getResource(uuid: string): Observable<IResource>;
  search(query: string, features?: Search.Features[], options?: SearchOptions): Observable<Search.Results>;
  suggest(query: string): Observable<Search.Suggestions>;
  getWidgets(): Observable<Widgets>;
  getWidget(widgetId: string): Observable<Widget>;
  counters(): Observable<Counters>;
  listResources(page?: number, size?: number): Observable<ResourceList>;
  getTempToken(): Observable<string>;
  listActivity(type?: EventType, page?: number, size?: number): Observable<EventList>;
}

export interface IWritableKnowledgeBox extends IKnowledgeBox {
  admin?: boolean;
  contrib?: boolean;
  modify(data: Partial<IKnowledgeBox>): Observable<void>;
  publish(published: boolean): Observable<void>;
  delete(): Observable<void>;
  setEntitiesGroup(groupId: string, group: EntitiesGroup): Observable<void>;
  deleteEntitiesGroup(groupId: string): Observable<void>;
  setLabelSet(setId: string, labelSet: LabelSet): Observable<void>;
  deleteLabelSet(setId: string): Observable<void>;
  createResource(resource: IResource): Observable<{ uuid: string }>;
  createLinkResource(link: LinkField, metadata?: UserMetadata): Observable<{ uuid: string }>;
  saveWidget(id: string, widget: Partial<Widget>): Observable<void>;
  deleteWidget(widgetId: string): Observable<void>;
  upload(file: File | FileWithMetadata, TUS?: boolean, metadata?: FileMetadata): Observable<UploadResponse>;
  upload(buffer: ArrayBuffer, TUS?: boolean, metadata?: FileMetadata): Observable<UploadResponse>;
  upload(
    data: File | FileWithMetadata | ArrayBuffer,
    TUS?: boolean,
    metadata?: FileMetadata,
  ): Observable<UploadResponse>;
  batchUpload(files: FileList | File[] | FileWithMetadata[]): Observable<UploadStatus>;
  getServiceAccounts(): Observable<ServiceAccount[]>;
  createServiceAccount(data: ServiceAccountCreation): Observable<void>;
  deleteServiceAccount(saId: string): Observable<void>;
  createKey(saId: string, expires: string): Observable<{ token: string }>;
  deleteKey(saId: string, saKeyId: string): Observable<void>;
}

export interface KnowledgeBoxCreation {
  slug: string;
  title: string;
  description?: string;
  zone?: string;
  sentence_embedder?: string;
  anonymization?: string;
}

export interface Entities {
  [key: string]: EntitiesGroup;
}

export interface EntitiesGroup {
  title?: string;
  color?: string;
  entities: { [key: string]: { value: string; merged?: boolean; represents?: string[] } };
}

export interface Label {
  title: string;
  related?: string;
  text?: string;
  uri?: string;
}

export interface LabelSet {
  title: string;
  color: string;
  multiple: boolean;
  kind: LabelSetKind[];
  labels: Label[];
}

export interface Labels {
  [id: string]: LabelSet;
}

export interface Widgets {
  [key: string]: Widget;
}

export interface Widget {
  id: string;
  mode: 'input' | 'form';
  placeholder?: string;
  description?: string;
  features: {
    useFilters: boolean;
    suggestEntities: boolean;
    suggestSentences: boolean;
    suggestParagraphs: boolean;
    suggestLabels: boolean;
    editLabels: boolean;
  };
  filters?: string[];
  topEntities?: string[];
  style?: { [key: string]: string };
}

export interface Counters {
  resources: number;
  paragraphs: number;
  fields: number;
  sentences: number;
}

export interface ResourceList {
  resources: Resource[];
  pagination: ResourcePagination;
}

export interface ResourcePagination {
  page: number;
  size: number;
  last: boolean;
}

export interface EventList {
  events: Event[];
  pagination: ResourcePagination;
}

export type Event = { [key: string]: any };

export interface ServiceAccountKey {
  id: string;
  created: string;
  expires: string;
}

export interface ServiceAccount {
  id: string;
  title: string;
  role: KBRoles;
  keys?: ServiceAccountKey[];
}

export interface ServiceAccountCreation {
  title: string;
  role: KBRoles;
}

export interface SearchOptions {
  highlight?: boolean;
  inTitleOnly?: boolean;
}
