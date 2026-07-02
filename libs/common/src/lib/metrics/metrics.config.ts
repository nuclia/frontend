export interface MetricsEmptyStateConfig {
  readonly titleKey: string;
  readonly descriptionKey: string;
  readonly actionKey: string;
}

export const METRICS_EMPTY_STATE = {
  noData: {
    titleKey: 'activity.metrics.empty.no-data.title',
    descriptionKey: 'activity.metrics.empty.no-data.description',
    actionKey: '',
  },
  filtered: {
    titleKey: 'activity.metrics.empty.filtered.title',
    descriptionKey: 'activity.metrics.empty.filtered.description',
    actionKey: 'activity.metrics.reset-filters',
  },
} as const satisfies Record<string, MetricsEmptyStateConfig>;

export const METRICS_PAGE_SIZES = [25, 50, 100] as const;
