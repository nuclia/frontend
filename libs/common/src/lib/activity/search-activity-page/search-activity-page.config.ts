import { ActivityLogItem, ActivityLogSearchShowField } from '@nuclia/core';
import { ActivityColumnDef } from '../activity-column.model';

export const SEARCH_ACTIVITY_COLUMNS: ActivityColumnDef[] = [
  { key: 'date', label: 'activity.column.date', value: (item: ActivityLogItem) => item.date ?? null, width: '120px' },
  { key: 'question', label: 'activity.column.question', value: (item: ActivityLogItem) => item.question ?? null, width: '1fr' },
  { key: 'resources_count', label: 'activity.column.resources-count', value: (item: ActivityLogItem) => item.resources_count ?? null, width: '130px' },
  { key: 'result_per_page', label: 'activity.column.results-per-page', value: (item: ActivityLogItem) => item.result_per_page ?? null, width: '130px' },
  { key: 'client_type', label: 'activity.column.client-type', value: (item: ActivityLogItem) => item.client_type ?? null, width: '120px' },
  { key: 'vectorset', label: 'activity.column.vectorset', value: (item: ActivityLogItem) => item.vectorset ?? null, width: '140px' },
  { key: 'retrieval_time', label: 'activity.column.retrieval-time', value: (item: ActivityLogItem) => item.retrieval_time ?? null, width: '120px' },
  { key: 'total_duration', label: 'activity.column.duration', value: (item: ActivityLogItem) => item.total_duration ?? null, width: '100px' },
];

export const SEARCH_ACTIVITY_SHOW_FIELDS: ActivityLogSearchShowField[] = [
  'date', 'question', 'resources_count', 'result_per_page',
  'client_type', 'vectorset', 'retrieval_time', 'total_duration',
];
