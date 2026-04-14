import { ACTIVITY_LOG_SHOW_FIELDS, ActivityLogItem } from '@nuclia/core';
import { MetricsColumnDef, MetricsSidebarField, ProcessingItem } from '../metrics-column.model';

export const PROCESSING_ACTIVITY_COLUMNS: MetricsColumnDef[] = [
  {
    key: 'date',
    label: 'activity.column.date',
    value: (item: ActivityLogItem) => item.date ?? null,
    width: '120px',
    group: 'query',
  },
  {
    key: 'client_type',
    label: 'activity.column.client-type',
    value: (item: ActivityLogItem) => item.client_type ?? null,
    width: '140px',
    group: 'query',
    searchable: true,
  },
  {
    key: 'status',
    label: 'activity.column.status',
    value: (item: ActivityLogItem) => (item as ProcessingItem)._displayStatus ?? null,
    width: '1fr',
    group: 'status',
  },
  {
    key: 'nuclia_tokens',
    label: 'activity.column.nuclia-tokens',
    value: (item: ActivityLogItem) => item.nuclia_tokens ?? null,
    width: '120px',
    group: 'tokens',
  },
  {
    key: 'id',
    label: 'activity.column.id',
    value: (item: ActivityLogItem) => item.id ?? null,
    width: '100px',
    defaultHidden: true,
    group: 'processing',
    searchable: true,
  },
  {
    key: 'resource_id',
    label: 'activity.column.resource-id',
    value: (item: ActivityLogItem) => item.resource_id ?? null,
    width: '1fr',
    defaultHidden: false,
    group: 'processing',
  },
  {
    key: 'total_duration',
    label: 'activity.column.duration',
    value: (item: ActivityLogItem) => item.total_duration ?? null,
    width: '140px',
    defaultHidden: true,
    group: 'tokens',
  },
];

const EXCLUDED_PROCESSING_FIELDS: readonly string[] = ['user_id', 'user_type', 'audit_metadata'];
export const PROCESSING_ACTIVITY_SHOW_FIELDS = ACTIVITY_LOG_SHOW_FIELDS.filter(
  (f) => !EXCLUDED_PROCESSING_FIELDS.includes(f),
);

export const PROCESSING_ACTIVITY_SIDEBAR_FIELDS: MetricsSidebarField[] = [];
