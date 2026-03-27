import { UserType } from '../../db.models';

export interface Metric {
  name: string;
  min: number;
  max: number;
  average: number;
}

export interface RemiScoresResponseItem {
  timestamp: string;
  metrics: Metric[];
}

export interface RemiScore {
  answer_relevance: { score: number; reason: string };
  context_relevance: number[];
  groundedness: number[];
}

export interface RemiQueryResponse {
  data: RemiQueryResponseItem[];
  has_more: boolean;
}

export interface RemiQueryResponseItem {
  id: number;
  question: string;
  answer: string;
  date?: string | null;
  remi?: RemiScore;
}

export interface RemiQueryResponseContextDetails extends RemiQueryResponseItem {
  context: { text: string; text_block_id: string | null }[];
}

/**
 * NO_CONTEXT means there was no answer to the query
 */
export type RemiAnswerStatus = 'SUCCESS' | 'ERROR' | 'NO_CONTEXT';

export interface RemiQueryCriteria {
  context_relevance?: {
    value: number;
    operation: 'gt' | 'lt' | 'eq';
    aggregation: 'average' | 'min' | 'max';
  };
  feedback_good?: boolean;
  status?: RemiAnswerStatus;
  month: string;
  from_date?: string;
  to_date?: string;
  pagination?: {
    limit?: number;
    starting_after?: number;
    ending_before?: number;
  };
}

export interface SearchMetricsItem {
  timestamp: string;
  search: number;
  chat: number;
}

export enum EventType {
  VISITED = 'visited',
  MODIFIED = 'modified',
  DELETED = 'deleted',
  NEW = 'new',
  STARTED = 'started',
  STOPPED = 'stopped',
  SEARCH = 'search',
  PROCESSED = 'processed',
  CHAT = 'chat',
  ASK = 'ask',
  SUGGEST = 'suggest',
  INDEXED = 'indexed',
  RETRIEVE = 'retrieve',
  AUGMENT = 'augment',
}

export type DownloadFormat = 'application/x-ndjson' | 'text/csv';

export interface ActivityLogDownloadQuery {
  year_month: string;
  show?: string[] | 'all';
  filters: ActivityLogFilters | ActivityLogSearchFilters | ActivityLogChatFilters | ActivityLogAskFilters;
  email_address?: string;
  notify_via_email?: boolean;
}

export interface ActivityLogDownload {
  request_id: string;
  download_type: string;
  download_format: DownloadFormat;
  event_type: EventType;
  requested_at: string;
  kb_id: string;
  download_url: string | null;
}

// ---------------------------------------------------------------------------
// Activity log live query (POST /activity/{event_type}/query)
// ---------------------------------------------------------------------------

/** Generic query base — parameterized by show-field type and filters type. */
export interface ActivityLogQueryBase<S extends string = ActivityLogShowFields, F = ActivityLogFilters> {
  year_month: string;
  pagination?: ActivityLogPagination;
  show?: S[] | 'all';
  filters: F;
}

export type ActivityLogBaseQuery = ActivityLogQueryBase;
export type ActivityLogSearchQuery = ActivityLogQueryBase<ActivityLogSearchShowFields, ActivityLogSearchFilters>;
export type ActivityLogChatQuery = ActivityLogQueryBase<ActivityLogChatShowFields, ActivityLogChatFilters>;
export type ActivityLogAskQuery = ActivityLogQueryBase<ActivityLogAskShowFields, ActivityLogAskFilters>;

export type ActivityLogQuery =
  | ActivityLogBaseQuery
  | ActivityLogSearchQuery
  | ActivityLogAskQuery
  | ActivityLogChatQuery;

export type ActivityLogResponseItemUnion =
  | ActivityLogResponseItem
  | ActivityLogResponseSearchItem
  | ActivityLogResponseChatItem
  | ActivityLogResponseAskItem;

/** @deprecated Use {@link ActivityLogResponseItemUnion} instead. */
export type ActvityLogResponseItem = ActivityLogResponseItemUnion;

export interface ActivityLogResponseItem {
  id: number;
  date: string | null;
  user_id: string | null;
  user_type: string | null;
  client_type: string | null;
  total_duration: number | null;
  audit_metadata: Record<string, string> | null;
  resource_id: string | null;
  nuclia_tokens: number | null;
}

export interface ActivityLogPagination {
  limit?: number;
  starting_after?: number;
  ending_before?: number;
}

export interface ActivityLogFilters {
  id?: ActivityLogFilter<number>;
  date?: ActivityLogFilter<string>;
  user_id?: ActivityLogFilter<string>;
  user_type?: ActivityLogFilter<UserType>;
  client_type?: ActivityLogFilter<string>;
  total_duration?: ActivityLogFilter<number>;
  nuclia_tokens?: ActivityLogFilter<number>;
  audit_metadata?: AuditMetadataFilter;
}

export const ACTIVITY_LOG_SHOW_FIELDS = [
  'id',
  'date',
  'user_id',
  'user_type',
  'client_type',
  'total_duration',
  'audit_metadata',
  'resource_id',
  'nuclia_tokens',
] as const;
export type ActivityLogShowFields = (typeof ACTIVITY_LOG_SHOW_FIELDS)[number];

/** @deprecated Use {@link ActivityLogShowFields} instead. */
export type ActivityLogBaseShowField = ActivityLogShowFields;

export interface ActivityLogResponseSearchItem extends ActivityLogResponseItem {
  question: string | null;
  resources_count: number | null;
  filter: string | null;
  retrieval_rephrased_question: string | null;
  vectorset: string | null;
  security: unknown | null;
  min_score_bm25: number | null;
  min_score_semantic: number | null;
  result_per_page: number | null;
  retrieval_time: number | null;
}

export interface ActivityLogSearchFilters extends ActivityLogFilters {
  question?: ActivityLogStringFilter;
  resources_count?: ActivityLogFilter<number>;
  vectorset?: ActivityLogStringFilter;
  min_score_bm25?: ActivityLogFilter<number>;
  min_score_semantic?: ActivityLogFilter<number>;
  result_per_page?: ActivityLogFilter<number>;
  retrieval_time?: ActivityLogFilter<number>;
}

export const ACTIVITY_LOG_SEARCH_SHOW_FIELDS = [
  ...ACTIVITY_LOG_SHOW_FIELDS,
  'question',
  'token_details',
  'resources_count',
  'filter',
  'retrieval_rephrased_question',
  'vectorset',
  'security',
  'min_score_bm25',
  'min_score_semantic',
  'result_per_page',
  'retrieval_time',
] as const;
export type ActivityLogSearchShowFields = (typeof ACTIVITY_LOG_SEARCH_SHOW_FIELDS)[number];

/** @deprecated Use {@link ActivityLogSearchShowFields} instead. */
export type ActivityLogSearchShowField = ActivityLogSearchShowFields;

export interface ActivityLogResponseChatItem extends ActivityLogResponseItem {
  question: string | null;
  rephrased_question: string | null;
  answer: string | null;
  learning_id: string | null;
  retrieved_context: unknown | null;
  chat_history: unknown | null;
  feedback_good: boolean | null;
  feedback_comment: string | null;
  feedback_good_all: boolean | null;
  feedback_good_any: boolean | null;
  feedback: unknown | null;
  model: string | null;
  rag_strategies_names: string[] | null;
  rag_strategies: unknown | null;
  /** AnswerStatusCode: '0'=SUCCESS, '-1'=ERROR, '-2'=NO_CONTEXT, '-3'=NO_RETRIEVAL_DATA. Null on resource events. */
  status: string | null;
  generative_answer_first_chunk_time: number | null;
  generative_reasoning_first_chunk_time: number | null;
  generative_answer_time: number | null;
  remi_scores: number | null;
  user_request: string | null;
  reasoning: string | null;
}

export interface ActivityLogChatFilters extends ActivityLogSearchFilters {
  rephrased_question?: ActivityLogStringFilter;
  answer?: ActivityLogStringFilter;
  learning_id?: ActivityLogStringFilter;
  feedback_good?: ActivityLogFilter<boolean>;
  feedback_good_all?: ActivityLogFilter<boolean>;
  feedback_good_any?: ActivityLogFilter<boolean>;
  feedback_comment?: ActivityLogStringFilter;
  model?: ActivityLogStringFilter;
  /** AnswerStatusCode: '0'=SUCCESS, '-1'=ERROR, '-2'=NO_CONTEXT, '-3'=NO_RETRIEVAL_DATA */
  status?: ActivityLogFilter<string>;
  generative_answer_first_chunk_time?: ActivityLogFilter<number>;
  generative_reasoning_first_chunk_time?: ActivityLogFilter<number>;
  generative_answer_time?: ActivityLogFilter<number>;
  reasoning?: ActivityLogStringFilter;
}

export const ACTIVITY_LOG_CHAT_SHOW_FIELDS = [
  ...ACTIVITY_LOG_SHOW_FIELDS,
  'question',
  'token_details',
  'rephrased_question',
  'answer',
  'learning_id',
  'retrieved_context',
  'chat_history',
  'feedback_good',
  'feedback_comment',
  'feedback_good_all',
  'feedback_good_any',
  'feedback',
  'model',
  'rag_strategies_names',
  'rag_strategies',
  'status',
  'generative_answer_first_chunk_time',
  'generative_reasoning_first_chunk_time',
  'generative_answer_time',
  'remi_scores',
  'user_request',
  'reasoning',
] as const;
export type ActivityLogChatShowFields = (typeof ACTIVITY_LOG_CHAT_SHOW_FIELDS)[number];

/** @deprecated Use {@link ActivityLogChatShowFields} instead. */
export type ActivityLogChatShowField = ActivityLogChatShowFields;

export interface ActivityLogResponseAskItem extends ActivityLogResponseChatItem {
  resources_count: number | null;
  filter: string | null;
  retrieval_rephrased_question: string | null;
  vectorset: string | null;
  security: unknown | null;
  min_score_bm25: number | null;
  min_score_semantic: number | null;
  result_per_page: number | null;
  retrieval_time: number | null;
}

export interface ActivityLogAskFilters extends ActivityLogChatFilters {
  resources_count?: ActivityLogFilter<number>;
  vectorset?: ActivityLogStringFilter;
  min_score_bm25?: ActivityLogFilter<number>;
  min_score_semantic?: ActivityLogFilter<number>;
  result_per_page?: ActivityLogFilter<number>;
  retrieval_time?: ActivityLogFilter<number>;
}

export const ACTIVITY_LOG_ASK_SHOW_FIELDS = [
  ...ACTIVITY_LOG_CHAT_SHOW_FIELDS,
  'resources_count',
  'filter',
  'retrieval_rephrased_question',
  'vectorset',
  'security',
  'min_score_bm25',
  'min_score_semantic',
  'result_per_page',
  'retrieval_time',
] as const;
export type ActivityLogAskShowFields = (typeof ACTIVITY_LOG_ASK_SHOW_FIELDS)[number];

/** @deprecated Use {@link ActivityLogAskShowFields} instead. */
export type ActivityLogAskShowField = ActivityLogAskShowFields;

// ---------------------------------------------------------------------------
// Generic filter helpers
// ---------------------------------------------------------------------------

export interface ActivityLogFilter<T> {
  eq?: T;
  gt?: T;
  ge?: T;
  lt?: T;
  le?: T;
  ne?: T;
  isnull?: boolean;
}

export interface ActivityLogStringFilter extends ActivityLogFilter<string> {
  like?: string;
  ilike?: string;
}

export interface AuditMetadataFilter extends ActivityLogStringFilter {
  key: string;
}

// ---------------------------------------------------------------------------
// Backward-compatible alias
// ---------------------------------------------------------------------------

/**
 * Backward-compatible alias — the "widest" response item containing all possible fields.
 * Prefer the specific response types (ActivityLogResponseItem, ActivityLogResponseSearchItem, etc.)
 * when the event type is known.
 */
export type ActivityLogItem = ActivityLogResponseAskItem;
