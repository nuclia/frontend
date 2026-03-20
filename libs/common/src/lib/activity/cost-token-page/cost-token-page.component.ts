import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivityMonthRange } from '../activity-column.model';
import { BooleanCondition, FilterApplyEvent, FilterColumnConfig } from '../activity-filters';
import { CostTokenPageService } from './cost-token-page.service';
import { COST_TOKEN_COLUMNS, COST_TOKEN_SIDEBAR_FIELDS } from './cost-token-page.config';

@Component({
  selector: 'app-cost-token-page',
  templateUrl: './cost-token-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class CostTokenPageComponent {
  protected service = inject(CostTokenPageService);
  readonly columns = COST_TOKEN_COLUMNS;
  readonly sidebarFields = COST_TOKEN_SIDEBAR_FIELDS;

  readonly filterColumns: FilterColumnConfig[] = [
    { key: 'feedback_good', labelKey: 'activity.column.feedback-good', type: 'boolean' },
    { key: 'feedback_good_all', labelKey: 'activity.column.feedback-good-all', type: 'boolean' },
    { key: 'feedback_good_any', labelKey: 'activity.column.feedback-good-any', type: 'boolean' },
    { key: 'total_duration', labelKey: 'activity.column.duration', type: 'numeric' },
    { key: 'nuclia_tokens', labelKey: 'activity.column.nuclia-tokens', type: 'numeric' },
    { key: 'status', labelKey: 'activity.column.status', type: 'numeric' },
    { key: 'generative_answer_first_chunk_time', labelKey: 'activity.column.generative-answer-first-chunk-time', type: 'numeric' },
    { key: 'generative_reasoning_first_chunk_time', labelKey: 'activity.column.generative-reasoning-first-chunk-time', type: 'numeric' },
    { key: 'generative_answer_time', labelKey: 'activity.column.generative-answer-time', type: 'numeric' },
    { key: 'resources_count', labelKey: 'activity.column.resources-count', type: 'numeric' },
    { key: 'min_score_bm25', labelKey: 'activity.column.min-score-bm25', type: 'numeric' },
    { key: 'min_score_semantic', labelKey: 'activity.column.min-score-semantic', type: 'numeric' },
    { key: 'result_per_page', labelKey: 'activity.column.results-per-page', type: 'numeric' },
    { key: 'retrieval_time', labelKey: 'activity.column.retrieval-time', type: 'numeric' },
  ];

  protected activeBooleanConditions = computed<BooleanCondition[]>(() => {
    const booleans = this.service.booleanFilters();
    const conditions: BooleanCondition[] = [];
    for (const [key, value] of Object.entries(booleans)) {
      if (value !== undefined) {
        conditions.push({ column: key, value });
      }
    }
    return conditions;
  });

  constructor() {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    this.service.loadData(currentMonth);
  }

  onMonthRangeChange(range: ActivityMonthRange): void {
    this.service.loadData(range.from);
  }

  onSearchChange(event: { term: string; column: string }): void {
    this.service.setSearch(event.term, event.column);
  }

  onLoadNextPage(): void {
    this.service.loadNextPage();
  }

  onDownloadRequested(event: { format: import('@nuclia/core').DownloadFormat; columns: string[] }): void {
    this.service.download(event.format, event.columns);
  }

  onFiltersApplied(event: FilterApplyEvent): void {
    const booleans: Record<string, boolean | undefined> = {};
    for (const bc of event.booleanConditions) {
      booleans[bc.column] = bc.value;
    }
    this.service.applyAllFilters(booleans, event.numericConditions);
  }
}
