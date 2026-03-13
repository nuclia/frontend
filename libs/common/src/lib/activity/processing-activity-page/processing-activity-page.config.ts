import { ActivityLogBaseShowField, ActivityLogItem } from '@nuclia/core';
import { ActivityColumnDef } from '../activity-column.model';

export type ProcessingItem = ActivityLogItem & { _displayStatus?: string };

export const PROCESSING_ACTIVITY_COLUMNS: ActivityColumnDef[] = [
  { key: 'date', label: 'activity.column.date', value: (item: ActivityLogItem) => item.date ?? null, width: '120px' },
  { key: 'resource_id', label: 'activity.column.resource-id', value: (item: ActivityLogItem) => item.resource_id ?? null, width: '1fr' },
  { key: 'status', label: 'activity.column.status', value: (item: ActivityLogItem) => (item as ProcessingItem)._displayStatus ?? null, width: '140px' },
  { key: 'total_duration', label: 'activity.column.duration', value: (item: ActivityLogItem) => item.total_duration ?? null, width: '140px' },
  { key: 'client_type', label: 'activity.column.client-type', value: (item: ActivityLogItem) => item.client_type ?? null, width: '140px' },
  { key: 'user_id', label: 'activity.column.user-id', value: (item: ActivityLogItem) => item.user_id ?? null, width: '1fr' },
];

export const PROCESSING_ACTIVITY_SHOW_FIELDS: ActivityLogBaseShowField[] = [
  'date', 'resource_id', 'total_duration', 'client_type', 'user_id',
];
