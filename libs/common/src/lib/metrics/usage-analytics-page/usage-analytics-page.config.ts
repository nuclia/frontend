import { ActivityLogItem } from '@nuclia/core';
import { MetricsColumnDef, MetricsSidebarField, UsageAnalyticsItem } from '../metrics-column.model';

export const USAGE_ANALYSIS_COLUMNS: MetricsColumnDef[] = [
  { key: 'date', label: 'activity.column.date', value: (item: ActivityLogItem) => item.date ?? null, width: '120px', group: 'query' },
  { key: 'question', label: 'activity.column.question', value: (item: ActivityLogItem) => item.question ?? null, width: '1fr', group: 'query' },
  { key: 'answer', label: 'activity.column.answer', value: (item: ActivityLogItem) => item.answer ?? null, width: '400px', group: 'query' },
  { key: 'status', label: 'activity.column.status', value: (item: ActivityLogItem) => (item as UsageAnalyticsItem)._displayStatus ?? null, width: '140px', group: 'remi' },
  {
    key: 'remiScore',
    label: 'activity.column.answer-relevance',
    value: (item: ActivityLogItem) => (item as UsageAnalyticsItem)._remiScore ?? null,
    width: '140px',
    group: 'remi',
    inlineAction: {
      icon: 'bulb',
      tooltip: 'activity.advice.trigger-tooltip',
      visible: (item: ActivityLogItem) => {
        const usageItem = item as UsageAnalyticsItem;
        const score = usageItem._remiAnswerRelevance ?? (item.remi_scores as number | null | undefined);
        const badScore = score !== null && score !== undefined && score < 3;
        const noScore = score === null || score === undefined;
        const badStatus = ['NO_CONTEXT', 'ERROR'].includes(usageItem._displayStatus ?? '');
        return badScore || (noScore && badStatus);
      },
    },
  },
];

export const USAGE_ANALYSIS_SIDEBAR_FIELDS: MetricsSidebarField[] = [];
