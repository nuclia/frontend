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
  user_id?: ActivityLogFilter<string>;
  user_type?: ActivityLogFilter<string>;
  client_type?: ActivityLogFilter<string>;
  total_duration?: ActivityLogFilter<number>;
  audit_metadata?: AuditMetadataFilter;
}

export interface ActivityLogSearchFilters extends ActivityLogFilters {
  question?: ActivityLogStringFilter;
  resources_count?: ActivityLogStringFilter;
}

export interface ActivityLogChatFilters extends ActivityLogSearchFilters {
  rephrased_question?: ActivityLogStringFilter;
  answer?: ActivityLogStringFilter;
  feedback_good?: ActivityLogFilter<boolean>;
  feedback_comment?: ActivityLogStringFilter;
  model?: ActivityLogStringFilter;
  status?: ActivityLogFilter<number>;
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
