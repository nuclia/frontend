import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TranslateModule, TranslatePipe } from '@ngx-translate/core';
import { MetricsMonthRange } from '../metrics-column.model';
import { DateCondition, FilterApplyEvent, FilterColumnConfig } from '../metrics-filters';
import { MetricsFiltersComponent } from '../metrics-filters/metrics-filters.component';
import { MetricsPageComponent } from '../metrics-page.component';
import { SEARCH_ACTIVITY_COLUMNS, SEARCH_ACTIVITY_SIDEBAR_FIELDS } from './search-activity-page.config';
import { SearchActivityPageService } from './search-activity-page.service';

@Component({
  selector: 'app-search-activity-page',
  templateUrl: './search-activity-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [SearchActivityPageService],
  imports: [MetricsPageComponent, MetricsFiltersComponent, DecimalPipe, TranslatePipe, TranslateModule],
})
export class SearchActivityPageComponent {
  protected service = inject(SearchActivityPageService);
  readonly columns = SEARCH_ACTIVITY_COLUMNS;
  readonly sidebarFields = SEARCH_ACTIVITY_SIDEBAR_FIELDS;

  readonly filterColumns: FilterColumnConfig[] = [
    { key: 'date', labelKey: 'activity.filter.date', type: 'date' },
    { key: 'total_duration', labelKey: 'activity.column.duration', type: 'numeric' },
    { key: 'nuclia_tokens', labelKey: 'activity.column.nuclia-tokens', type: 'numeric' },
    { key: 'resources_count', labelKey: 'activity.column.resources-count', type: 'numeric' },
    { key: 'min_score_bm25', labelKey: 'activity.column.min-score-bm25', type: 'numeric' },
    { key: 'min_score_semantic', labelKey: 'activity.column.min-score-semantic', type: 'numeric' },
    { key: 'result_per_page', labelKey: 'activity.column.results-per-page', type: 'numeric' },
    { key: 'retrieval_time', labelKey: 'activity.column.retrieval-time', type: 'numeric' },
  ];

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

  onDownloadRequested(event: { format: import('@nuclia/core').DownloadFormat }): void {
    this.service.download(event.format);
  }

  onFiltersApplied(event: FilterApplyEvent): void {
    this.service.applyAllFilters(event.numericConditions, event.dateConditions ?? []);
  }
}
