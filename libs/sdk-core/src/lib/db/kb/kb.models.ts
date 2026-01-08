import type { Observable } from 'rxjs';
import type { IErrorResponse } from '../../models';
import { LearningConfigurations, ResourceProperties } from '../db.models';
import { NotificationMessage, NotificationOperation } from '../notifications';
import type { ExtractedDataTypes, IResource, LinkField, Origin, Resource, UserMetadata } from '../resource';
import type { Ask, CatalogOptions, ChatOptions, PredictAnswerOptions, Search, SearchOptions } from '../search';
import { Agentic } from '../search/agentic';
import { TaskManager } from '../task';
import type { FileMetadata, FileWithMetadata, UploadResponse, UploadStatus } from '../upload';
import { ActivityMonitor } from './activity';
import { SyncManager } from '../sync/sync';

export type KBStates = 'PUBLISHED' | 'PRIVATE';
export type KBRoles = 'SOWNER' | 'SCONTRIBUTOR' | 'SMEMBER';

export enum LabelSetKind {
  RESOURCES = 'RESOURCES',
  PARAGRAPHS = 'PARAGRAPHS',
}

export interface IKnowledgeBoxBase {
  id: string;
  slug: string;
  title: string;
  state?: KBStates;
  description?: string;
  zone: string;
  allowed_origins?: string[] | null;
  allowed_ip_addresses?: string[] | null;
  search_configs?: { [key: string]: any };
  hidden_resources_enabled?: boolean;
  hidden_resources_hide_on_creation?: boolean;
  external_index_provider?: string;
}

export interface IKnowledgeBoxStandalone {
  slug: string;
  uuid: string;
  config?: {
    slug?: string;
    title?: string;
    description?: string;
    hidden_resources_enabled?: boolean;
    hidden_resources_hide_on_creation?: boolean;
  };
}

export interface IKnowledgeBoxItem extends IKnowledgeBoxBase {
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

export interface IKnowledgeBox extends IKnowledgeBoxBase {
  get path(): string;

  get fullpath(): string;

  getEntities(): Observable<Entities>;

  getEntitiesGroup(groupId: string): Observable<EntitiesGroup>;

  getSynonyms(): Observable<Synonyms>;

  getFacets(facets: string[]): Observable<Search.FacetsResult>;

  getLabels(): Observable<LabelSets>;

  getResource(uuid: string, show?: ResourceProperties[], extracted?: ExtractedDataTypes[]): Observable<IResource>;

  getFullResource(uuid: string): Observable<IResource>;

  getResourceBySlug(slug: string, show?: ResourceProperties[], extracted?: ExtractedDataTypes[]): Observable<IResource>;

  getFullResourceBySlug(slug: string): Observable<IResource>;

  createAgenticRAGPipeline(steps: Agentic.Steps): Agentic.Pipeline;

  ask(
    query: string,
    context?: Ask.ContextEntry[],
    features?: Ask.Features[],
    options?: ChatOptions,
  ): Observable<Ask.Answer | IErrorResponse>;
  ask(
    query: string,
    context?: Ask.ContextEntry[],
    features?: Ask.Features[],
    options?: ChatOptions,
    callback?: (answer: Ask.Answer | IErrorResponse) => void,
  ): Observable<Ask.Answer | IErrorResponse>;

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

  predictAnswer(question: string, options?: PredictAnswerOptions): Observable<Ask.Answer | IErrorResponse>;

  generate(question: string, context: string[]): Observable<{ answer: string; cannotAnswer: boolean }>;

  generateJSON(
    question: string,
    json_schema: object,
    context: string[],
  ): Observable<{ answer: object; success: boolean }>;

  rephrase(question: string, user_context?: string[], rephrase_prompt?: string): Observable<string>;

  generateRandomQuestionAboutResource(resource: Resource): Observable<string>;

  catalog(query: string, options?: CatalogOptions): Observable<Search.Results | IErrorResponse>;

  suggest(query: string): Observable<Search.Suggestions | IErrorResponse>;

  feedback(answerId: string, good: boolean, feedback?: string, text_block_id?: string): Observable<void>;

  counters(): Observable<Counters>;

  listResources(page?: number, size?: number): Observable<ResourceList>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getTempToken(payload?: any, ignoreExpiration?: boolean): Observable<string>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getConfiguration(): Observable<{ [id: string]: any }>;
  getLearningSchema(): Observable<LearningConfigurations>;
  getGenerativeProviders(): Observable<GenerativeProviders>;

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
  getSearchConfig(id: string): Observable<SearchConfig>;

  getExtractStrategies(): Observable<ExtractStrategies>;

  getSplitStrategies(): Observable<SplitStrategies>;

  getSearchConfigs(): Observable<SearchConfigs>;
}

export interface IWritableKnowledgeBox extends IKnowledgeBox {
  admin?: boolean;
  contrib?: boolean;
  activityMonitor?: ActivityMonitor;
  taskManager: TaskManager;
  syncManager: SyncManager;

  modify(data: Partial<IKnowledgeBox>): Observable<void>;

  publish(published: boolean): Observable<void>;

  delete(): Observable<void>;

  setLabelSet(setId: string, labelSet: LabelSet): Observable<void>;

  deleteLabelSet(setId: string): Observable<void>;

  /**
   * @deprecated Will be removed in version 1.18.0
   * @param synonyms
   */
  setSynonyms(synonyms: Synonyms): Observable<void>;

  /**
   * @deprecated Will be removed in version 1.18.0
   */
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

  addVectorset(model: string): Observable<void>;

  removeVectorset(model: string): Observable<void>;

  createExtractStrategy(config: ExtractConfig): Observable<void>;

  deleteExtractStrategy(id: string): Observable<void>;

  createSplitStrategy(strategy: SplitStrategy): Observable<void>;

  deleteSplitStrategy(id: string): Observable<void>;

  createSearchConfig(id: string, config: SearchConfig): Observable<void>;

  updateSearchConfig(id: string, config: SearchConfig): Observable<void>;

  deleteSearchConfig(id: string): Observable<void>;
}

export interface KnowledgeBoxCreation {
  slug: string;
  title: string;
  zone?: string;
  description?: string;
  learning_configuration?: { [configId: string]: any };
  external_index_provider?: any;
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

export enum RAG_METADATAS {
  ORIGIN = 'origin',
  LABELS = 'classification_labels',
  NERS = 'ners',
  EXTRA = 'extra_metadata',
}

export enum RagStrategyName {
  FIELD_EXTENSION = 'field_extension',
  FULL_RESOURCE = 'full_resource',
  HIERARCHY = 'hierarchy',
  METADATAS = 'metadata_extension',
  NEIGHBOURING_PARAGRAPHS = 'neighbouring_paragraphs',
  PREQUERIES = 'prequeries',
  CONVERSATION = 'conversation',
  GRAPH = 'graph_beta',
}

export interface Prequery {
  request: SearchOptions & { query: string; features?: Search.Features[] };
  weight?: number;
  id?: string;
}

export interface FieldExtensionStrategy {
  name: RagStrategyName.FIELD_EXTENSION;
  fields?: string[];
  data_augmentation_field_prefixes?: string[];
}
export interface FullResourceStrategy {
  name: RagStrategyName.FULL_RESOURCE;
  count?: number;
  include_remaining_text_blocks?: boolean;
  apply_to?: {
    exclude: string[];
  };
}
export interface HierarchyStrategy {
  name: RagStrategyName.HIERARCHY;
  count?: number;
}
export interface MetadatasStrategy {
  name: RagStrategyName.METADATAS;
  types: RAG_METADATAS[];
}
export interface NeighbouringParagraphsStrategy {
  name: RagStrategyName.NEIGHBOURING_PARAGRAPHS;
  before: number;
  after: number;
}
export interface PrequeriesStrategy {
  name: RagStrategyName.PREQUERIES;
  queries: Prequery[];
}
export interface ConversationalStrategy {
  name: RagStrategyName.CONVERSATION;
  attachments_text: boolean;
  attachments_images: boolean;
  full: boolean;
  max_messages?: number;
}
export interface GraphStrategy {
  name: RagStrategyName.GRAPH;
  hops: number;
  top_k: number;
  /** @deprecated
   * Use exclude_processor_relations
   */
  agentic_graph_only?: boolean; // backward compat
  exclude_processor_relations?: boolean;
  relation_ranking?: 'generative' | 'reranker';
  relation_text_as_paragraphs?: boolean;
  query_entity_detection?: 'predict' | 'suggest';
}
export type RAGStrategy =
  | FieldExtensionStrategy
  | FullResourceStrategy
  | HierarchyStrategy
  | MetadatasStrategy
  | NeighbouringParagraphsStrategy
  | PrequeriesStrategy
  | ConversationalStrategy
  | GraphStrategy;

export enum RagImageStrategyName {
  PAGE_IMAGE = 'page_image',
  PARAGRAPH_IMAGE = 'paragraph_image',
}
export interface PageImageStrategy {
  name: RagImageStrategyName.PAGE_IMAGE;
  count?: number;
}
export interface ParagraphImageStrategy {
  name: RagImageStrategyName.PARAGRAPH_IMAGE;
}
export type RAGImageStrategy = PageImageStrategy | ParagraphImageStrategy;

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

/**
 * @deprecated
 */
export interface SynonymsPayload {
  synonyms: Synonyms;
}

/**
 * @deprecated
 */
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

export type ExtractStrategies = {
  [id: string]: ExtractConfig;
};

export interface ExtractConfig {
  name?: string;
  vllm_config?: ExtractVLLMConfig;
  ai_tables?: ExtractVLLMConfig;
  split?: { max_paragraph?: number };
}

export interface ExtractLLMConfig {
  generative_model?: string;
  generative_provider?: string;
  generative_prompt_id?: string;
  user_keys?: any;
}

export interface ExtractVLLMConfig {
  llm?: ExtractLLMConfig;
  rules?: string[];
  merge_pages?: boolean;
  max_pages_to_merge?: number;
}

export type SplitStrategies = {
  [id: string]: SplitStrategy;
};

export interface SplitStrategy {
  name?: string;
  max_paragraph?: number;
  custom_split?: CustomSplitStrategy;
  llm_split?: SplitLLMConfig;
  manual_split?: { splitter: string };
}

export interface SplitLLMConfig {
  llm?: ExtractLLMConfig;
  rules?: string[];
}

export enum CustomSplitStrategy {
  NONE = 0,
  MANUAL = 1,
  LLM = 2,
}

export type SearchConfigs = { [key: string]: SearchConfig };

export type SearchConfig = AskConfig | FindConfig;

export interface AskConfig {
  kind: 'ask';
  config: ChatOptions;
}

export interface FindConfig {
  kind: 'find';
  config: SearchOptions;
}

export interface GenerativeProviders {
  [key: string]: GenerativeProvider;
}

export interface GenerativeProvider {
  title: string;
  enterprise_readiness: boolean;
  models: { [key: string]: ModelInfo };
}

export interface ModelInfo {
  name: string;
  title: string;
  description?: string;
  config: ModelConfig;
  features: ModelFeatures;
  metadata: ModelMetadata;
}

export interface ModelConfig {
  input_tokens: { min?: number; max: number };
  output_tokens: { min?: number; max: number; default_max?: number };
  prompt_id?: string;
  driver?: string;
  max_images?: string;
  assume_role?: number;
}

export interface ModelFeatures {
  reasoning?: {
    default: number | ReasoningEffort;
    available_efforts?: ReasoningEffort;
  };
  tools?: any;
  structured_output?: any;
  vision?: any;
  streaming?: any;
  system_message?: any;
  text_extraction?: any;
  custom_keys?: any;
  file_input?: any;
  image_generation?: any;
}

export interface ModelMetadata {
  data_region?: string;
  deployed_region?: string;
  deprecated?: boolean;
  shut_down_date?: string;
  superseded_by?: string;
  stability?: ModelStability;
  knowledge_cutoff_date?: string;
  release_date?: string;
}

export enum ModelStability {
  STABLE = 'stable',
  PREVIEW = 'preview',
}

export enum ReasoningEffort {
  MINIMAL = 'minimal',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}
