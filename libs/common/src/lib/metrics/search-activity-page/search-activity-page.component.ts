import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MetricsMonthRange } from '../metrics-column.model';
import { FilterApplyEvent, FilterColumnConfig } from '../metrics-filters';
import { SearchActivityPageService } from './search-activity-page.service';
import { SEARCH_ACTIVITY_COLUMNS, SEARCH_ACTIVITY_SIDEBAR_FIELDS } from './search-activity-page.config';

@Component({
  selector: 'app-search-activity-page',
  templateUrl: './search-activity-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
  providers: [SearchActivityPageService],
})
export class SearchActivityPageComponent {
  protected service = inject(SearchActivityPageService);
  readonly columns = SEARCH_ACTIVITY_COLUMNS;
  readonly sidebarFields = SEARCH_ACTIVITY_SIDEBAR_FIELDS;

  readonly filterColumns: FilterColumnConfig[] = [
    { key: 'total_duration', labelKey: 'activity.column.duration', type: 'numeric' },
    { key: 'nuclia_tokens', labelKey: 'activity.column.nuclia-tokens', type: 'numeric' },
    { key: 'resources_count', labelKey: 'activity.column.resources-count', type: 'numeric' },
    { key: 'min_score_bm25', labelKey: 'activity.column.min-score-bm25', type: 'numeric' },
    { key: 'min_score_semantic', labelKey: 'activity.column.min-score-semantic', type: 'numeric' },
    { key: 'result_per_page', labelKey: 'activity.column.results-per-page', type: 'numeric' },
    { key: 'retrieval_time', labelKey: 'activity.column.retrieval-time', type: 'numeric' },
  ];

  constructor() {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    this.service.loadData(currentMonth);
  }

  onMonthRangeChange(range: MetricsMonthRange): void {
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
    this.service.applyAllFilters(event.numericConditions);
  }
}
