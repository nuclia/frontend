import { ActivityLogAskShowField, ActivityLogItem } from '@nuclia/core';
import { ActivityColumnDef } from '../activity-column.model';

export const USAGE_ANALYSIS_COLUMNS: ActivityColumnDef[] = [
  { key: 'date', label: 'activity.column.date', value: (item: ActivityLogItem) => item.date ?? null, width: '120px' },
  { key: 'question', label: 'activity.column.question', value: (item: ActivityLogItem) => item.question ?? null, width: '1fr' },
  { key: 'answer', label: 'activity.column.answer', value: (item: ActivityLogItem) => item.answer ?? null, width: '400px' },
];

export const USAGE_ANALYSIS_SHOW_FIELDS: ActivityLogAskShowField[] = [
  'date', 'question', 'answer', 'rag_strategies_names',
];
