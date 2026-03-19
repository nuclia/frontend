import { ActivityLogAskShowField, ActivityLogItem } from '@nuclia/core';
import { ActivityColumnDef, ActivitySidebarField } from '../activity-column.model';

export const COST_TOKEN_COLUMNS: ActivityColumnDef[] = [
  { key: 'date', label: 'activity.column.date', value: (item: ActivityLogItem) => item.date ?? null, width: '120px', group: 'query' },
  { key: 'question', label: 'activity.column.question', value: (item: ActivityLogItem) => item.question ?? null, width: '1fr', group: 'query' },
  { key: 'answer', label: 'activity.column.answer', value: (item: ActivityLogItem) => item.answer ?? null, defaultHidden: true, width: '400px', group: 'query' },
  { key: 'client_type', label: 'activity.column.client-type', value: (item: ActivityLogItem) => item.client_type ?? null, width: '120px', group: 'query' },
  { key: 'model', label: 'activity.column.model', value: (item: ActivityLogItem) => item.model ?? null, width: '180px', group: 'generative' },
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
  { key: 'reasoning', label: 'activity.column.reasoning', value: (item: ActivityLogItem) => item.reasoning ?? null, width: '400px', defaultHidden: true, group: 'generative' },
  { key: 'resources_count', label: 'activity.column.resources-count', value: (item: ActivityLogItem) => item.resources_count ?? null, width: '130px', defaultHidden: true, group: 'retrieval' },
  { key: 'vectorset', label: 'activity.column.vectorset', value: (item: ActivityLogItem) => item.vectorset ?? null, width: '140px', defaultHidden: true, group: 'retrieval' },
];

export const COST_TOKEN_SHOW_FIELDS: ActivityLogAskShowField[] = [
  'date', 'question', 'answer', 'client_type', 'model', 'nuclia_tokens',
  'generative_answer_first_chunk_time', 'generative_answer_time',
  'generative_reasoning_first_chunk_time', 'retrieval_time', 'status', 'total_duration',
  'feedback_good', 'feedback_good_all', 'feedback_good_any',
  'min_score_bm25', 'min_score_semantic', 'reasoning', 'resources_count', 'vectorset',
];

export const COST_TOKEN_SIDEBAR_FIELDS: ActivitySidebarField[] = [];
