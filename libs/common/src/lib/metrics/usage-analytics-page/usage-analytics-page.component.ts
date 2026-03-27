import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RemiAnswerStatus } from '@nuclia/core';
import { MetricsMonthRange } from '../metrics-column.model';
import { BooleanCondition, DateCondition, FilterApplyEvent, FilterColumnConfig, NumericCondition, NumericOperation } from '../metrics-filters';
import { UsageAnalyticsPageService } from './usage-analytics-page.service';
import { USAGE_ANALYSIS_COLUMNS, USAGE_ANALYSIS_SIDEBAR_FIELDS } from './usage-analytics-page.config';

@Component({
  selector: 'app-usage-analytics-page',
  templateUrl: './usage-analytics-page.component.html',
  styleUrl: './usage-analytics-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
  providers: [UsageAnalyticsPageService],
})
export class UsageAnalyticsPageComponent {
  protected service = inject(UsageAnalyticsPageService);
  readonly columns = USAGE_ANALYSIS_COLUMNS;
  readonly sidebarFields = USAGE_ANALYSIS_SIDEBAR_FIELDS;

  // ── Filter configs ──────────────────────────────────────────────────────────

  readonly syntheticStatuses = ['SUCCESS', 'ERROR', 'NO_CONTEXT'];

  readonly syntheticStatusLabelsMap: Record<string, string> = {
    SUCCESS: 'activity.remi-analytics.status.success',
    ERROR: 'activity.remi-analytics.status.error',
    NO_CONTEXT: 'activity.remi-analytics.status.no-context',
  };

  readonly filterColumns: FilterColumnConfig[] = [
    { key: 'feedback_good', labelKey: 'activity.filter.feedback', type: 'boolean' },
    { key: 'content_relevance', labelKey: 'activity.filter.content_relevance', type: 'numeric', allowedOperations: ['lt', 'gt', 'eq'] },
    { key: 'date', labelKey: 'activity.filter.date', type: 'date' },
  ];

  protected activeBooleanConditions = computed<BooleanCondition[]>(() => {
    const fg = this.service.feedbackGoodFilter();
    if (fg !== undefined) {
      return [{ column: 'feedback_good', value: fg }];
    }
    return [];
  });

  protected activeNumericConditions = computed<NumericCondition[]>(() => {
    const cr = this.service.contentRelevanceFilter();
    if (cr) {
      return [{ column: 'content_relevance', operation: cr.operation as NumericOperation, value: cr.value }];
    }
    return [];
  });

  protected syntheticStatusDisabled = computed(() => {
    return this.service.contentRelevanceFilter() !== undefined;
  });

  protected selectedMonth = signal<string>(this._currentMonth());
  protected activeDateConditions = computed<DateCondition[]>(() => this.service.dateConditions());

  private _currentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  constructor() {
    this.service.loadData(this._currentMonth());
  }

  // ── Data handlers ─────────────────────────────────────────────────────────

  onMonthRangeChange(range: MetricsMonthRange): void {
    this.service.loadData(range.from);
    this.selectedMonth.set(range.from);
  }

  onLoadNextPage(): void {
    this.service.loadNextPage();
  }

  // ── Filter handlers ───────────────────────────────────────────────────────

  onFiltersApplied(event: FilterApplyEvent): void {
    const statuses = (event.syntheticStatuses ?? this.syntheticStatuses) as RemiAnswerStatus[];
    const feedbackCondition = event.booleanConditions.find((c) => c.column === 'feedback_good');
    const crCondition = event.numericConditions.find((c) => c.column === 'content_relevance');
    const contentRelevance = crCondition
      ? { value: crCondition.value, operation: crCondition.operation as 'gt' | 'lt' | 'eq', aggregation: 'max' as const }
      : undefined;
    this.service.applyAllFilters(statuses, feedbackCondition?.value, contentRelevance, event.dateConditions ?? []);
  }
}
