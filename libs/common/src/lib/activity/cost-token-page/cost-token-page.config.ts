import { ActivityLogAskShowField, ActivityLogItem } from '@nuclia/core';
import { ActivityColumnDef } from '../activity-column.model';

export const COST_TOKEN_COLUMNS: ActivityColumnDef[] = [
  { key: 'date', label: 'activity.column.date', value: (item: ActivityLogItem) => item.date ?? null, width: '120px' },
  { key: 'question', label: 'activity.column.question', value: (item: ActivityLogItem) => item.question ?? null, width: '1fr' },
  { key: 'model', label: 'activity.column.model', value: (item: ActivityLogItem) => item.model ?? null, width: '180px' },
  {
    key: 'rag_strategies_names',
    label: 'activity.column.rag-strategy',
    value: (item: ActivityLogItem) =>
      Array.isArray(item.rag_strategies_names) ? item.rag_strategies_names.join(', ') : null,
    width: '180px',
  },
  { key: 'nuclia_tokens', label: 'activity.column.nuclia-tokens', value: (item: ActivityLogItem) => item.nuclia_tokens ?? null, width: '100px' },
];

export const COST_TOKEN_SHOW_FIELDS: ActivityLogAskShowField[] = [
  'date', 'question', 'model', 'rag_strategies_names', 'nuclia_tokens',
];
