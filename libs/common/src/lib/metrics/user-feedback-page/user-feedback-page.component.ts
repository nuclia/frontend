import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MetricsMonthRange } from '../metrics-column.model';
import { DateCondition, FilterApplyEvent, FilterColumnConfig } from '../metrics-filters';
import { UserFeedbackPageService } from './user-feedback-page.service';
import { USER_FEEDBACK_COLUMNS, USER_FEEDBACK_SIDEBAR_FIELDS } from './user-feedback-page.config';

@Component({
  selector: 'app-user-feedback-page',
  templateUrl: './user-feedback-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
  providers: [UserFeedbackPageService],
})
export class UserFeedbackPageComponent {
  protected service = inject(UserFeedbackPageService);
  readonly columns = USER_FEEDBACK_COLUMNS;
  readonly sidebarFields = USER_FEEDBACK_SIDEBAR_FIELDS;

  readonly filterColumns: FilterColumnConfig[] = [
    { key: 'date', labelKey: 'activity.filter.date', type: 'date' },
    { key: 'feedback_good', labelKey: 'activity.filter.feedback_good', type: 'boolean' },
    { key: 'feedback_good_any', labelKey: 'activity.filter.feedback_good_any', type: 'boolean' },
    { key: 'feedback_good_all', labelKey: 'activity.filter.feedback_good_all', type: 'boolean' },
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
    this.service.applyAllFilters(event.booleanConditions, event.dateConditions ?? []);
  }
}
