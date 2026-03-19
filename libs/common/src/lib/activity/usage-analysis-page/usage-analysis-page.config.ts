import { ActivityLogItem } from '@nuclia/core';
import { ActivityColumnDef, ActivitySidebarField } from '../activity-column.model';

export type UsageAnalysisItem = ActivityLogItem & { _displayStatus?: string; _remiScore?: number | null };

export const USAGE_ANALYSIS_COLUMNS: ActivityColumnDef[] = [
  { key: 'question', label: 'activity.column.question', value: (item: ActivityLogItem) => item.question ?? null, width: '1fr', group: 'query' },
  { key: 'answer', label: 'activity.column.answer', value: (item: ActivityLogItem) => item.answer ?? null, width: '400px', group: 'query' },
  { key: 'status', label: 'activity.column.status', value: (item: ActivityLogItem) => (item as UsageAnalysisItem)._displayStatus ?? null, width: '140px', group: 'remi' },
  { key: 'remiScore', label: 'activity.remi-analytics.remi-score', value: (item: ActivityLogItem) => (item as UsageAnalysisItem)._remiScore ?? null, width: '120px', group: 'remi' },
];

export const USAGE_ANALYSIS_SIDEBAR_FIELDS: ActivitySidebarField[] = [];
