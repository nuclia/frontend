import { ActivityLogBaseShowField, ActivityLogItem } from '@nuclia/core';
import { ActivityColumnDef, ActivitySidebarField } from '../activity-column.model';

export type ProcessingItem = ActivityLogItem & { _displayStatus?: string };

export const PROCESSING_ACTIVITY_COLUMNS: ActivityColumnDef[] = [
  { key: 'date', label: 'activity.column.date', value: (item: ActivityLogItem) => item.date ?? null, width: '120px', group: 'query' },
  { key: 'client_type', label: 'activity.column.client-type', value: (item: ActivityLogItem) => item.client_type ?? null, width: '140px', group: 'query', searchable: true },
  { key: 'status', label: 'activity.column.status', value: (item: ActivityLogItem) => (item as ProcessingItem)._displayStatus ?? null, width: '140px', group: 'status' },
  { key: 'nuclia_tokens', label: 'activity.column.nuclia-tokens', value: (item: ActivityLogItem) => item.nuclia_tokens ?? null, width: '120px', group: 'tokens' },
  { key: 'id', label: 'activity.column.id', value: (item: ActivityLogItem) => item.id ?? null, width: '100px', defaultHidden: true, group: 'processing', searchable: true },
  { key: 'resource_id', label: 'activity.column.resource-id', value: (item: ActivityLogItem) => item.resource_id ?? null, width: '1fr', defaultHidden: false, group: 'processing' },
  { key: 'total_duration', label: 'activity.column.duration', value: (item: ActivityLogItem) => item.total_duration ?? null, width: '140px', defaultHidden: true, group: 'tokens' },
];

export const PROCESSING_ACTIVITY_SHOW_FIELDS: ActivityLogBaseShowField[] = [
  'date', 'client_type', 'total_duration', 'resource_id', 'id', 'nuclia_tokens',
];

export const PROCESSING_ACTIVITY_SIDEBAR_FIELDS: ActivitySidebarField[] = [];
