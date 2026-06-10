import { ActivityLogItem } from '@nuclia/core';
import { MetricsColumnDef, MetricsSidebarField, UsageAnalyticsItem } from '../metrics-column.model';
import { getRemiColorClass, getRemiScoreDisplay } from '../metrics-utils';

export const USAGE_ANALYSIS_COLUMNS: MetricsColumnDef[] = [
  {
    key: 'date',
    label: 'activity.column.date',
    value: (item: ActivityLogItem) => item.date ?? null,
    width: '120px',
    group: 'query',
  },
  {
    key: 'question',
    label: 'activity.column.question',
    value: (item: ActivityLogItem) => item.question ?? null,
    width: '1fr',
    group: 'query',
  },
  {
    key: 'answer',
    label: 'activity.column.answer',
    value: (item: ActivityLogItem) => item.answer ?? null,
    width: '400px',
    group: 'query',
  },
  {
    key: 'status',
    label: 'activity.column.status',
    value: (item: ActivityLogItem) => (item as UsageAnalyticsItem)._displayStatus ?? null,
    width: '140px',
    group: 'remi',
  },
  {
    key: 'remiScore',
    label: 'activity.column.remi-score',
    value: (item: ActivityLogItem) => getRemiScoreDisplay((item as UsageAnalyticsItem)._remiScore).displayValue,
    width: '150px',
    group: 'remi',
    colorFn: (item: ActivityLogItem) => getRemiColorClass((item as UsageAnalyticsItem)._remiScore),
    inlineAction: {
      icon: 'sparks',
      tooltip: 'activity.advice.trigger-tooltip',
      visible: (item: ActivityLogItem) => {
        const usageItem = item as UsageAnalyticsItem;
        const score = usageItem._remiScore;
        const badScore = score !== null && score !== undefined && score < 3;
        const noScore = score === null || score === undefined;
        const badStatus = ['NO_CONTEXT', 'ERROR'].includes(usageItem._rawStatus ?? '');
        return badScore || (noScore && badStatus);
      },
    },
  },
  {
    key: 'issue',
    label: 'Issue',
    value: (item: ActivityLogItem) => (item as UsageAnalyticsItem)._issueLabel ?? 'No data',
    width: '150px',
    group: 'remi',
  },
  {
    key: 'answerRelevance',
    label: 'activity.column.answer-relevance',
    value: (item: ActivityLogItem) =>
      getRemiScoreDisplay((item as UsageAnalyticsItem)._remiAnswerRelevance).displayValue,
    width: '120px',
    group: 'remi',
    colorFn: (item: ActivityLogItem) => getRemiColorClass((item as UsageAnalyticsItem)._remiAnswerRelevance),
  },
  {
    key: 'contentRelevance',
    label: 'activity.column.content-relevance',
    value: (item: ActivityLogItem) =>
      getRemiScoreDisplay((item as UsageAnalyticsItem)._remiContextRelevance).displayValue,
    width: '120px',
    group: 'remi',
    colorFn: (item: ActivityLogItem) => getRemiColorClass((item as UsageAnalyticsItem)._remiContextRelevance),
  },
  {
    key: 'groundedness',
    label: 'activity.column.groundedness',
    value: (item: ActivityLogItem) => getRemiScoreDisplay((item as UsageAnalyticsItem)._remiGroundedness).displayValue,
    width: '120px',
    group: 'remi',
    colorFn: (item: ActivityLogItem) => getRemiColorClass((item as UsageAnalyticsItem)._remiGroundedness),
  },
];

export const USAGE_ANALYSIS_SIDEBAR_FIELDS: MetricsSidebarField[] = [];
