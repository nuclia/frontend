import { ActivityLogItem } from '@nuclia/core';
import { MetricsColumnDef, MetricsSidebarField } from '../metrics-column.model';

export const USER_FEEDBACK_SHOW_FIELDS = [
  'date',
  'question',
  'answer',
  'feedback_good',
  'feedback_comment',
  'feedback_good_any',
  'feedback_good_all',
] as const;

export const USER_FEEDBACK_DOWNLOAD_SHOW_FIELDS = [
  'date',
  'question',
  'answer',
  'feedback_good',
  'feedback_comment',
  'feedback_good_any',
  'feedback_good_all',
] as const;

function getFeedback(item: ActivityLogItem): boolean | null {
  const val = item.feedback_good ?? item.feedback_good_any ?? item.feedback_good_all;
  return val ?? null;
}

export const USER_FEEDBACK_COLUMNS: MetricsColumnDef[] = [
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
    searchable: true,
  },
  {
    key: 'answer',
    label: 'activity.column.answer',
    value: (item: ActivityLogItem) => item.answer ?? null,
    width: '1fr',
    group: 'query',
    searchable: true,
  },
  {
    key: 'feedback',
    label: 'activity.column.feedback-good',
    value: (item: ActivityLogItem) => {
      const fb = getFeedback(item);
      if (fb === null) return null;
      return fb ? 'Good' : 'Bad';
    },
    width: '100px',
    group: 'feedback',
    iconFn: (item: ActivityLogItem) => {
      const fb = getFeedback(item);
      if (fb === null) return null;
      return fb ? 'thumb-up' : 'thumb-down';
    },
    iconColorClass: (item: ActivityLogItem) => {
      const fb = getFeedback(item);
      if (fb === null) return null;
      return fb ? 'feedback-positive' : 'feedback-negative';
    },
  },
  {
    key: 'feedback_comment',
    label: 'activity.column.details',
    value: (item: ActivityLogItem) => item.feedback_comment ?? null,
    width: '1fr',
    group: 'feedback',
    searchable: true,
  },
];

export const USER_FEEDBACK_SIDEBAR_FIELDS: MetricsSidebarField[] = [];
