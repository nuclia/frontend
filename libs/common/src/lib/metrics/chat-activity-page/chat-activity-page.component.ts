import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MetricsMonthRange } from '../metrics-column.model';
import { BooleanCondition, DateCondition, FilterApplyEvent, FilterColumnConfig } from '../metrics-filters';
import { ChatActivityPageService } from './chat-activity-page.service';
import { CHAT_ACTIVITY_COLUMNS, CHAT_ACTIVITY_SIDEBAR_FIELDS } from './chat-activity-page.config';

@Component({
  selector: 'app-chat-activity-page',
  templateUrl: './chat-activity-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
  providers: [ChatActivityPageService],
})
export class ChatActivityPageComponent {
  protected service = inject(ChatActivityPageService);
  readonly columns = CHAT_ACTIVITY_COLUMNS;
  readonly sidebarFields = CHAT_ACTIVITY_SIDEBAR_FIELDS;

  readonly filterColumns: FilterColumnConfig[] = [
    { key: 'date', labelKey: 'activity.filter.date', type: 'date' },
    { key: 'feedback_good', labelKey: 'activity.column.feedback-good', type: 'boolean' },
    { key: 'feedback_good_all', labelKey: 'activity.column.feedback-good-all', type: 'boolean' },
    { key: 'feedback_good_any', labelKey: 'activity.column.feedback-good-any', type: 'boolean' },
    { key: 'total_duration', labelKey: 'activity.column.duration', type: 'numeric' },
    { key: 'nuclia_tokens', labelKey: 'activity.column.nuclia-tokens', type: 'numeric' },
    { key: 'status', labelKey: 'activity.column.status', type: 'numeric' },
    { key: 'generative_answer_time', labelKey: 'activity.column.generative-answer-time', type: 'numeric' },
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

  onDownloadRequested(event: { format: import('@nuclia/core').DownloadFormat }): void {
    this.service.download(event.format);
  }

  onFiltersApplied(event: FilterApplyEvent): void {
    const booleans = event.booleanConditions.reduce<Record<string, boolean | undefined>>(
      (acc, bc) => ({ ...acc, [bc.column]: bc.value }),
      {},
    );
    this.service.applyAllFilters(booleans, event.numericConditions, event.dateConditions ?? []);
  }
}
