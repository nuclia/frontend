import type { Observable } from 'rxjs';
import type { IResource, LinkField, Origin, Resource, UserMetadata } from '../resource';
import type { FileMetadata, FileWithMetadata, UploadResponse, UploadStatus } from '../upload';
import type { Chat, Search, SearchOptions } from '../search';
import type { IErrorResponse } from '../../models';

export type KBStates = 'PUBLISHED' | 'PRIVATE';
export type KBRoles = 'SOWNER' | 'SCONTRIBUTOR' | 'SMEMBER';

export enum ResourceProperties {
  BASIC = 'basic',
  ORIGIN = 'origin',
  RELATIONS = 'relations',
  VALUES = 'values',
  EXTRACTED = 'extracted',
  ERRORS = 'errors',
  EXTRA = 'extra',
}

export enum ResourceFieldProperties {
  VALUE = 'value',
  EXTRACTED = 'extracted',
  ERROR = 'error',
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
  uuid?: string;
}

export interface IKnowledgeBoxItem extends IKnowledgeBoxCreation {
  role_on_kb?: KBRoles;
}

export interface IStandaloneKb {
  slug: string;
  uuid: string;
}

export interface IKnowledgeBox extends IKnowledgeBoxCreation {
  get path(): string;

  get fullpath(): string;

  getEntities(withEntities?: boolean): Observable<Entities>;

  getEntitiesGroup(groupId: string): Observable<EntitiesGroup>;

  getSynonyms(): Observable<Synonyms>;

  getLabels(): Observable<LabelSets>;

  getResource(uuid: string, show?: ResourceProperties[], extracted?: ExtractedDataTypes[]): Observable<IResource>;

  getResourceBySlug(slug: string, show?: ResourceProperties[], extracted?: ExtractedDataTypes[]): Observable<IResource>;

  chat(query: string, context?: Chat.ContextEntry[], features?: Chat.Features[]): Observable<Chat.Answer>;

  find(
    query: string,
    features?: Search.Features[],
    options?: SearchOptions,
  ): Observable<Search.FindResults | IErrorResponse>;

  search(
    query: string,
    features?: Search.Features[],
    options?: SearchOptions,
  ): Observable<Search.Results | IErrorResponse>;

  catalog(query: string, options?: SearchOptions): Observable<Search.Results | IErrorResponse>;

  suggest(query: string): Observable<Search.Suggestions | IErrorResponse>;

  feedback(answerId: string, good: boolean): Observable<void>;

  counters(): Observable<Counters>;

  listResources(page?: number, size?: number): Observable<ResourceList>;

  getTempToken(): Observable<string>;

  listActivity(type?: EventType, page?: number, size?: number): Observable<EventList>;

  getConfiguration(): Observable<{ [id: string]: string }>;
}

export interface IWritableKnowledgeBox extends IKnowledgeBox {
  admin?: boolean;
  contrib?: boolean;

  modify(data: Partial<IKnowledgeBox>): Observable<void>;

  publish(published: boolean): Observable<void>;

  delete(): Observable<void>;

  createEntitiesGroup(groupId: string, group: EntitiesGroup): Observable<void>;

  updateEntitiesGroup(groupId: string, payload: UpdateEntitiesGroupPayload): Observable<void>;

  deleteEntitiesGroup(groupId: string): Observable<void>;

  setLabelSet(setId: string, labelSet: LabelSet): Observable<void>;

  deleteLabelSet(setId: string): Observable<void>;

  setSynonyms(synonyms: Synonyms): Observable<void>;

  deleteAllSynonyms(): Observable<void>;

  createResource(resource: IResource): Observable<{ uuid: string }>;

  createLinkResource(
    link: LinkField,
    metadata?: UserMetadata,
    synchronous?: boolean,
    origin?: Origin,
  ): Observable<{ uuid: string }>;

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

  createKeyForService(data: ServiceAccountCreation, expires: string): Observable<{ token: string }>;

  createKey(saId: string, expires: string): Observable<{ token: string }>;

  deleteKey(saId: string, saKeyId: string): Observable<void>;

  setConfiguration(config: { [id: string]: string }): Observable<void>;
}

export interface KnowledgeBoxCreation {
  slug: string;
  title: string;
  description?: string;
  zone?: string;
  learning_configuration?: { [configId: string]: string };
}

export interface Entities {
  [key: string]: EntitiesGroup;
}

export interface Entity {
  value: string;
  merged?: boolean;
  represents?: string[];
}

export interface EntitiesGroup {
  title?: string;
  color?: string;
  entities: { [key: string]: Entity };
  custom?: boolean;
}

export interface UpdateEntitiesGroupPayload {
  title?: string;
  color?: string;
  add: { [key: string]: Entity };
  update: { [key: string]: Entity };
  delete: string[];
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

export interface LabelSets {
  [id: string]: LabelSet;
}

export interface WidgetFeatures {
  editLabels?: boolean;
  entityAnnotation?: boolean;
  filter?: boolean;
  navigateToFile?: boolean;
  navigateToLink?: boolean;
  notPublic?: boolean;
  permalink?: boolean;
  relations?: boolean;
  suggestions?: boolean;
  suggestLabels?: boolean;
  answers?: boolean;
  onlyAnswers?: boolean;
  speech?: boolean;
  knowledgeGraph?: boolean;
  useSynonyms?: boolean;
  autofilter?: boolean;
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

export interface SynonymsPayload {
  synonyms: Synonyms;
}

export interface Synonyms {
  [main: string]: string[];
}
