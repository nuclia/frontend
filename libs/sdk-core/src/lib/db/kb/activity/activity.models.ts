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
  filters: ActivityLogFilters | ActivityLogSearchFilters | ActivityLogChatFilters;
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

export interface ActivityLogFilters {
  id?: ActivityLogFilter<number>;
  user_id?: ActivityLogStringFilter;
  user_type?: ActivityLogStringFilter;
  client_type?: ActivityLogStringFilter;
  total_duration?: ActivityLogFilter<number>;
  nuclia_tokens?: ActivityLogFilter<number>;
  audit_metadata?: AuditMetadataFilter;
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
}

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
// Activity log live query (POST /activity/{event_type}/query)
// ---------------------------------------------------------------------------

export interface ActivityLogPagination {
  limit?: number;
  starting_after?: number;
  ending_before?: number;
}

/** Base query — used for generic / resource event types (new, modified, processed, etc.) */
export interface ActivityLogBaseQuery {
  year_month: string;
  pagination?: ActivityLogPagination;
  show?: ActivityLogBaseShowField[] | 'all';
  filters: ActivityLogFilters;
}

export type ActivityLogBaseShowField =
  | 'id' | 'date' | 'user_id' | 'user_type' | 'client_type'
  | 'total_duration' | 'audit_metadata' | 'resource_id'
  | 'nuclia_tokens';

/** Search query — event_type = 'search' */
export interface ActivityLogSearchQuery {
  year_month: string;
  pagination?: ActivityLogPagination;
  show?: ActivityLogSearchShowField[] | 'all';
  filters: ActivityLogSearchFilters;
}

export type ActivityLogSearchShowField =
  | ActivityLogBaseShowField
  | 'question' | 'resources_count' | 'filter' | 'retrieval_rephrased_question'
  | 'vectorset' | 'security' | 'min_score_bm25' | 'min_score_semantic'
  | 'result_per_page' | 'retrieval_time';

/** Ask query — event_type = 'ask' */
export interface ActivityLogAskQuery {
  year_month: string;
  pagination?: ActivityLogPagination;
  show?: ActivityLogAskShowField[] | 'all';
  filters: ActivityLogAskFilters;
}

export type ActivityLogAskShowField =
  | ActivityLogBaseShowField
  | 'question' | 'rephrased_question' | 'answer' | 'learning_id' | 'retrieved_context'
  | 'chat_history' | 'feedback_good' | 'feedback_comment' | 'feedback_good_all'
  | 'feedback_good_any' | 'feedback' | 'model' | 'rag_strategies_names' | 'rag_strategies'
  | 'status' | 'generative_answer_first_chunk_time' | 'generative_reasoning_first_chunk_time'
  | 'generative_answer_time' | 'remi_scores' | 'user_request' | 'reasoning'
  | 'resources_count' | 'filter' | 'retrieval_rephrased_question' | 'vectorset'
  | 'security' | 'min_score_bm25' | 'min_score_semantic' | 'result_per_page' | 'retrieval_time';

export interface ActivityLogAskFilters extends ActivityLogChatFilters {
  generative_answer_first_chunk_time?: ActivityLogFilter<number>;
  generative_reasoning_first_chunk_time?: ActivityLogFilter<number>;
  generative_answer_time?: ActivityLogFilter<number>;
  reasoning?: ActivityLogStringFilter;
}

/** Chat query — event_type = 'chat' */
export interface ActivityLogChatQuery {
  year_month: string;
  pagination?: ActivityLogPagination;
  show?: ActivityLogChatShowField[] | 'all';
  filters: ActivityLogChatFilters;
}

export type ActivityLogChatShowField =
  | ActivityLogBaseShowField
  | 'question' | 'rephrased_question' | 'answer' | 'learning_id' | 'retrieved_context'
  | 'chat_history' | 'feedback_good' | 'feedback_comment' | 'feedback_good_all'
  | 'feedback_good_any' | 'feedback' | 'model' | 'rag_strategies_names' | 'rag_strategies'
  | 'status' | 'generative_answer_first_chunk_time' | 'generative_reasoning_first_chunk_time'
  | 'generative_answer_time' | 'remi_scores' | 'user_request' | 'reasoning';

export type ActivityLogQuery =
  | ActivityLogBaseQuery
  | ActivityLogSearchQuery
  | ActivityLogAskQuery
  | ActivityLogChatQuery;

// ---------------------------------------------------------------------------
// Activity log item — shape of each NDJSON line in the query response
// ---------------------------------------------------------------------------

export interface ActivityLogItem {
  id: number;
  date: string | null;
  user_id: string | null;
  user_type: string | null;
  client_type: string | null;
  total_duration: number | null;
  audit_metadata: Record<string, string> | null;
  resource_id: string | null;
  nuclia_tokens: number | null;
  // Search + Ask fields
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
  // Ask + Chat fields
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
