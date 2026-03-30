import { ACTIVITY_LOG_ASK_SHOW_FIELDS, ActivityLogItem } from '@nuclia/core';
import { MetricsColumnDef, MetricsSidebarField } from '../metrics-column.model';

export const COST_TOKEN_COLUMNS: MetricsColumnDef[] = [
  { key: 'date', label: 'activity.column.date', value: (item: ActivityLogItem) => item.date ?? null, width: '120px', group: 'query' },
  { key: 'question', label: 'activity.column.question', value: (item: ActivityLogItem) => item.question ?? null, width: '1fr', group: 'query', searchable: true },
  { key: 'answer', label: 'activity.column.answer', value: (item: ActivityLogItem) => item.answer ?? null, defaultHidden: true, width: '400px', group: 'query', searchable: true },
  { key: 'client_type', label: 'activity.column.client-type', value: (item: ActivityLogItem) => item.client_type ?? null, width: '120px', group: 'query', searchable: true },
  { key: 'model', label: 'activity.column.model', value: (item: ActivityLogItem) => item.model ?? null, width: '180px', group: 'generative', searchable: true },
  { key: 'nuclia_tokens', label: 'activity.column.nuclia-tokens', value: (item: ActivityLogItem) => item.nuclia_tokens ?? null, width: '100px', group: 'tokens' },
  { key: 'generative_answer_first_chunk_time', label: 'activity.column.generative-answer-first-chunk-time', value: (item: ActivityLogItem) => item.generative_answer_first_chunk_time ?? null, width: '140px', group: 'generative' },
  { key: 'generative_answer_time', label: 'activity.column.generative-answer-time', value: (item: ActivityLogItem) => item.generative_answer_time ?? null, width: '120px', group: 'generative' },
  { key: 'generative_reasoning_first_chunk_time', label: 'activity.column.generative-reasoning-first-chunk-time', value: (item: ActivityLogItem) => item.generative_reasoning_first_chunk_time ?? null, defaultHidden: true, width: '140px', group: 'generative' },
  { key: 'retrieval_time', label: 'activity.column.retrieval-time', value: (item: ActivityLogItem) => item.retrieval_time ?? null, width: '120px', group: 'retrieval' },
  { key: 'status', label: 'activity.column.status', value: (item: ActivityLogItem) => item.status ?? null, width: '120px', group: 'status' },
  { key: 'total_duration', label: 'activity.column.duration', value: (item: ActivityLogItem) => item.total_duration ?? null, width: '100px', group: 'tokens' },
  { key: 'feedback_good', label: 'activity.column.feedback-good', value: (item: ActivityLogItem) => item.feedback_good != null ? String(item.feedback_good) : null, width: '100px', defaultHidden: true, group: 'feedback' },
  { key: 'feedback_good_all', label: 'activity.column.feedback-good-all', value: (item: ActivityLogItem) => item.feedback_good_all != null ? String(item.feedback_good_all) : null, width: '120px', defaultHidden: true, group: 'feedback' },
  { key: 'feedback_good_any', label: 'activity.column.feedback-good-any', value: (item: ActivityLogItem) => item.feedback_good_any != null ? String(item.feedback_good_any) : null, width: '120px', defaultHidden: true, group: 'feedback' },
  { key: 'min_score_bm25', label: 'activity.column.min-score-bm25', value: (item: ActivityLogItem) => item.min_score_bm25 ?? null, width: '120px', defaultHidden: true, group: 'retrieval' },
  { key: 'min_score_semantic', label: 'activity.column.min-score-semantic', value: (item: ActivityLogItem) => item.min_score_semantic ?? null, width: '120px', defaultHidden: true, group: 'retrieval' },
  { key: 'reasoning', label: 'activity.column.reasoning', value: (item: ActivityLogItem) => item.reasoning ?? null, width: '400px', defaultHidden: true, group: 'generative', searchable: true },
  { key: 'resources_count', label: 'activity.column.resources-count', value: (item: ActivityLogItem) => item.resources_count ?? null, width: '130px', defaultHidden: true, group: 'retrieval' },
  { key: 'vectorset', label: 'activity.column.vectorset', value: (item: ActivityLogItem) => item.vectorset ?? null, width: '140px', defaultHidden: true, group: 'retrieval', searchable: true },
];

const EXCLUDED_COST_TOKEN_FIELDS: readonly string[] = [
  'id', 'user_id', 'user_type', 'audit_metadata', 'resource_id', 'token_details',
  'rephrased_question', 'learning_id', 'retrieved_context', 'chat_history',
  'feedback_comment', 'feedback', 'rag_strategies_names', 'rag_strategies',
  'remi_scores', 'user_request', 'filter', 'retrieval_rephrased_question',
  'security', 'result_per_page',
];
export const COST_TOKEN_SHOW_FIELDS = ACTIVITY_LOG_ASK_SHOW_FIELDS.filter(
  (f) => !EXCLUDED_COST_TOKEN_FIELDS.includes(f),
);

export const COST_TOKEN_SIDEBAR_FIELDS: MetricsSidebarField[] = [];
