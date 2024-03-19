import type { Observable } from 'rxjs';
import type { ExtractedDataTypes, IResource, LinkField, Origin, Resource, UserMetadata } from '../resource';
import type { FileMetadata, FileWithMetadata, UploadResponse, UploadStatus } from '../upload';
import type { Chat, ChatOptions, Search, SearchOptions } from '../search';
import type { IErrorResponse } from '../../models';
import { LearningConfigurations, ResourceProperties } from '../db.models';
import { NotificationMessage, NotificationOperation } from '../notifications';

export type KBStates = 'PUBLISHED' | 'PRIVATE';
export type KBRoles = 'SOWNER' | 'SCONTRIBUTOR' | 'SMEMBER';

export enum LabelSetKind {
  RESOURCES = 'RESOURCES',
  PARAGRAPHS = 'PARAGRAPHS',
  SELECTIONS = 'SELECTIONS',
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
  CHAT = 'CHAT',
}

export interface IKnowledgeBoxCreation {
  id: string;
  slug: string;
  title: string;
  state?: KBStates;
  description?: string;
  zone: string;
  uuid?: string;
  allowed_origins?: string[] | null;
}

export interface IKnowledgeBoxItem extends IKnowledgeBoxCreation {
  role_on_kb?: KBRoles;
}

export interface IStandaloneKb {
  slug: string;
  uuid: string;
}

export interface FullKbUser {
  id: string;
  name: string;
  email: string;
  role: KBRoles;
}

export interface KbUser {
  id: string;
  role: KBRoles;
}

export interface KbUserPayload {
  add?: KbUser[];
  update?: KbUser[];
  delete?: string[];
}

export interface InviteKbData {
  email: string;
  role: KBRoles;
}

export interface KbInvite {
  email: string;
  role: KBRoles;
  expires: string;
}

export interface IKnowledgeBox extends IKnowledgeBoxCreation {
  get path(): string;

  get fullpath(): string;

  getEntities(): Observable<Entities>;

  getEntitiesGroup(groupId: string): Observable<EntitiesGroup>;

  getSynonyms(): Observable<Synonyms>;

  getLabels(): Observable<LabelSets>;

  getResource(uuid: string, show?: ResourceProperties[], extracted?: ExtractedDataTypes[]): Observable<IResource>;

  getResourceBySlug(slug: string, show?: ResourceProperties[], extracted?: ExtractedDataTypes[]): Observable<IResource>;

  chat(
    query: string,
    context?: Chat.ContextEntry[],
    features?: Chat.Features[],
    options?: ChatOptions,
  ): Observable<Chat.Answer | IErrorResponse>;
  chat(
    query: string,
    context?: Chat.ContextEntry[],
    features?: Chat.Features[],
    options?: ChatOptions,
    callback?: (answer: Chat.Answer | IErrorResponse) => void,
  ): Observable<Chat.Answer | IErrorResponse>;

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

  summarize(ressourceIds: string[]): Observable<string>;

  tokens(text: string): Observable<SentenceToken[]>;

  generate(question: string, context: string[]): Observable<{ answer: string; cannotAnswer: boolean }>;

  rephrase(question: string): Observable<string>;

  generateRandomQuestionAboutResource(resource: Resource): Observable<string>;

  catalog(query: string, options?: SearchOptions): Observable<Search.Results | IErrorResponse>;

  suggest(query: string): Observable<Search.Suggestions | IErrorResponse>;

  feedback(answerId: string, good: boolean): Observable<void>;
  listFeedback(): Observable<string[]>;

  counters(): Observable<Counters>;

  listResources(page?: number, size?: number): Observable<ResourceList>;

  getTempToken(): Observable<string>;

  listActivity(type?: EventType, page?: number, size?: number): Observable<EventList>;

  listActivityDownloads(type: EventType): Observable<ActivityDownloadList>;

  downloadActivity(type: EventType, month: string): Observable<Blob>;

  getConfiguration(): Observable<{ [id: string]: any }>;
  getLearningSchema(): Observable<LearningConfigurations>;

  getUsers(accountSlug: string): Observable<FullKbUser[]>;

  listenToAllNotifications(): Observable<NotificationMessage[]>;
  listenToProcessingNotifications(): Observable<ResourceProcessingNotification[]>;
  listenToResourceOperationNotifications(): Observable<ResourceOperationNotification[]>;
  stopListeningToNotifications(): void;

  processingStatus(
    cursor?: string,
    scheduled?: boolean,
    limit?: number,
  ): Observable<{ cursor: string; results: ProcessingStatus[] }>;
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

  createResource(resource: IResource, synchronous: boolean): Observable<{ uuid: string }>;

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

  deleteServiceAccount(serviceAccountId: string): Observable<void>;

  createKeyForService(data: ServiceAccountCreation, expires: string): Observable<{ token: string }>;

  createKey(serviceAccountId: string, expires: string): Observable<{ token: string }>;

  deleteKey(serviceAccountId: string, serviceAccountKeyId: string): Observable<void>;

  setConfiguration(config: { [id: string]: any }): Observable<void>;

  updateUsers(data: KbUserPayload): Observable<void>;

  inviteToKb(data: InviteKbData): Observable<void>;
}

export interface KnowledgeBoxCreation {
  slug: string;
  title: string;
  description?: string;
  learning_configuration?: { [configId: string]: any };
}

export interface Entities {
  [key: string]: BaseEntitiesGroup;
}

export interface Entity {
  value: string;
  merged?: boolean;
  represents?: string[];
}

export interface BaseEntitiesGroup {
  title?: string;
  color?: string;
  custom?: boolean;
}

export interface EntitiesGroup extends BaseEntitiesGroup {
  entities: { [key: string]: Entity };
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
  autocompleteFromNERs?: boolean;
  displayMetadata?: boolean;
  answers?: boolean;
  hideLogo?: boolean;
  hideResults?: boolean;
  hideThumbnails?: boolean;
  knowledgeGraph?: boolean;
  useSynonyms?: boolean;
  autofilter?: boolean;
  noBM25forChat?: boolean;
  citations?: boolean;
}
export type RAGStrategyName = 'field_extension' | 'full_resource';
export interface RAGStrategy {
  name: RAGStrategyName;
  fields?: string[];
}

export interface Counters {
  resources: number;
  paragraphs: number;
  fields: number;
  sentences: number;
  index_size: number;
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

export interface ActivityDownloadList {
  downloads: string[];
}

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

export interface SentenceToken {
  text: string;
  ner: string;
  start: number;
  end: number;
}

export interface ProcessingStatus {
  completed: boolean;
  completed_at?: string | null;
  failed: boolean;
  kbid: string;
  processing_id: string;
  resource_id: string;
  retries: number;
  schedule_eta: number;
  schedule_order: number;
  scheduled: boolean;
  scheduled_at: string;
  timestamp: string;
  title: string;
}

export interface ResourceBaseNotification {
  resourceId: string;
  resourceTitle: string;
  timestamp: string;
  success: boolean;
}
export interface ResourceOperationNotification extends ResourceBaseNotification {
  operation: NotificationOperation;
}
export type ResourceProcessingNotification = ResourceBaseNotification;
