import { ActivityLogItem, ActivityLogSearchShowField } from '@nuclia/core';
import { ActivityColumnDef, ActivitySidebarField } from '../activity-column.model';

export const SEARCH_ACTIVITY_COLUMNS: ActivityColumnDef[] = [
  { key: 'date', label: 'activity.column.date', value: (item: ActivityLogItem) => item.date ?? null, width: '120px', group: 'query' },
  { key: 'question', label: 'activity.column.question', value: (item: ActivityLogItem) => item.question ?? null, width: '1fr', group: 'query' },
  { key: 'client_type', label: 'activity.column.client-type', value: (item: ActivityLogItem) => item.client_type ?? null, width: '120px', group: 'query' },
  { key: 'min_score_semantic', label: 'activity.column.min-score-semantic', value: (item: ActivityLogItem) => item.min_score_semantic ?? null, width: '120px', group: 'retrieval' },
  { key: 'total_duration', label: 'activity.column.duration', value: (item: ActivityLogItem) => item.total_duration ?? null, width: '100px', group: 'tokens' },
  { key: 'id', label: 'activity.column.id', value: (item: ActivityLogItem) => item.id ?? null, width: '100px', defaultHidden: true, group: 'query' },
  { key: 'min_score_bm25', label: 'activity.column.min-score-bm25', value: (item: ActivityLogItem) => item.min_score_bm25 ?? null, width: '120px', defaultHidden: true, group: 'retrieval' },
  { key: 'nuclia_tokens', label: 'activity.column.nuclia-tokens', value: (item: ActivityLogItem) => item.nuclia_tokens ?? null, width: '120px', defaultHidden: true, group: 'tokens' },
  { key: 'resources_count', label: 'activity.column.resources-count', value: (item: ActivityLogItem) => item.resources_count ?? null, width: '130px', defaultHidden: true, group: 'retrieval' },
  { key: 'retrieval_time', label: 'activity.column.retrieval-time', value: (item: ActivityLogItem) => item.retrieval_time ?? null, width: '120px', defaultHidden: true, group: 'retrieval' },
  { key: 'vectorset', label: 'activity.column.vectorset', value: (item: ActivityLogItem) => item.vectorset ?? null, width: '140px', defaultHidden: true, group: 'retrieval' },
];

export const SEARCH_ACTIVITY_SHOW_FIELDS: ActivityLogSearchShowField[] = [
  'date', 'question', 'client_type', 'min_score_semantic', 'total_duration',
  'id', 'min_score_bm25', 'nuclia_tokens', 'resources_count',
  'retrieval_time', 'vectorset', 'retrieval_rephrased_question',
];

export const SEARCH_ACTIVITY_SIDEBAR_FIELDS: ActivitySidebarField[] = [
  { key: 'retrieval_rephrased_question', label: 'activity.column.retrieval-rephrased-question', value: (item: ActivityLogItem) => item.retrieval_rephrased_question ?? null, expandable: true, group: 'retrieval' },
];
