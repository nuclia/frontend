import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MetricsMonthRange } from '../metrics-column.model';
import { BooleanCondition, DateCondition, FilterApplyEvent, FilterColumnConfig } from '../metrics-filters';
import { CostTokenUsagePageService } from './cost-token-usage-page.service';
import { COST_TOKEN_COLUMNS, COST_TOKEN_SIDEBAR_FIELDS } from './cost-token-usage-page.config';
import { DownloadFormat } from '@nuclia/core';

@Component({
  selector: 'app-cost-token-usage-page',
  templateUrl: './cost-token-usage-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
  providers: [CostTokenUsagePageService],
})
export class CostTokenUsagePageComponent {
  protected service = inject(CostTokenUsagePageService);
  readonly columns = COST_TOKEN_COLUMNS;
  readonly sidebarFields = COST_TOKEN_SIDEBAR_FIELDS;

  readonly filterColumns: FilterColumnConfig[] = [
    { key: 'date', labelKey: 'activity.filter.date', type: 'date' },
    { key: 'feedback_good', labelKey: 'activity.column.feedback-good', type: 'boolean' },
    { key: 'feedback_good_all', labelKey: 'activity.column.feedback-good-all', type: 'boolean' },
    { key: 'feedback_good_any', labelKey: 'activity.column.feedback-good-any', type: 'boolean' },
    { key: 'total_duration', labelKey: 'activity.column.duration', type: 'numeric' },
    { key: 'nuclia_tokens', labelKey: 'activity.column.nuclia-tokens', type: 'numeric' },
    { key: 'status', labelKey: 'activity.column.status', type: 'numeric' },
    {
      key: 'generative_answer_first_chunk_time',
      labelKey: 'activity.column.generative-answer-first-chunk-time',
      type: 'numeric',
    },
    {
      key: 'generative_reasoning_first_chunk_time',
      labelKey: 'activity.column.generative-reasoning-first-chunk-time',
      type: 'numeric',
    },
    { key: 'generative_answer_time', labelKey: 'activity.column.generative-answer-time', type: 'numeric' },
    { key: 'resources_count', labelKey: 'activity.column.resources-count', type: 'numeric' },
    { key: 'min_score_bm25', labelKey: 'activity.column.min-score-bm25', type: 'numeric' },
    { key: 'min_score_semantic', labelKey: 'activity.column.min-score-semantic', type: 'numeric' },
    { key: 'result_per_page', labelKey: 'activity.column.results-per-page', type: 'numeric' },
    { key: 'retrieval_time', labelKey: 'activity.column.retrieval-time', type: 'numeric' },
  ];

  protected activeBooleanConditions = computed<BooleanCondition[]>(() => {
    return Object.entries(this.service.booleanFilters())
      .filter(([, value]) => value !== undefined)
      .map(([column, value]) => ({ column, value: value! }));
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

  onMonthRangeChange(range: MetricsMonthRange): void {
    this.service.loadData(range.from);
    this.selectedMonth.set(range.from);
  }

  onSearchChange(event: { term: string; column: string }): void {
    this.service.setSearch(event.term, event.column);
  }

  onLoadNextPage(): void {
    this.service.loadNextPage();
  }

  onDownloadRequested(event: { format: DownloadFormat; columns: string[] }): void {
    this.service.download(event.format, event.columns);
  }

  onFiltersApplied(event: FilterApplyEvent): void {
    const booleans = event.booleanConditions.reduce<Record<string, boolean | undefined>>(
      (acc, bc) => ({ ...acc, [bc.column]: bc.value }),
      {},
    );
    this.service.applyAllFilters(booleans, event.numericConditions, event.dateConditions ?? []);
  }
}
