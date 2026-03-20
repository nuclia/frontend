import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RemiAnswerStatus } from '@nuclia/core';
import { ActivityMonthRange } from '../activity-column.model';
import { BooleanCondition, FilterApplyEvent, FilterColumnConfig, NumericCondition, NumericOperation } from '../activity-filters';
import { UsageAnalysisPageService } from './usage-analysis-page.service';
import { USAGE_ANALYSIS_COLUMNS, USAGE_ANALYSIS_SIDEBAR_FIELDS } from './usage-analysis-page.config';

@Component({
  selector: 'app-usage-analysis-page',
  templateUrl: './usage-analysis-page.component.html',
  styleUrl: './usage-analysis-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class UsageAnalysisPageComponent {
  protected service = inject(UsageAnalysisPageService);
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

  constructor() {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    this.service.loadData(currentMonth);
  }

  // ── Data handlers ─────────────────────────────────────────────────────────

  onMonthRangeChange(range: ActivityMonthRange): void {
    this.service.loadData(range.from);
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
    this.service.applyAllFilters(statuses, feedbackCondition?.value, contentRelevance);
  }
}
