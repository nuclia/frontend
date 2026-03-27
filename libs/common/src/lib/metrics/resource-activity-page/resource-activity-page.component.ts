import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { EventType } from '@nuclia/core';
import { MetricsMonthRange } from '../metrics-column.model';
import { DateCondition, FilterApplyEvent, FilterColumnConfig } from '../metrics-filters';
import { ResourceActivityPageService } from './resource-activity-page.service';
import { PROCESSING_ACTIVITY_COLUMNS, PROCESSING_ACTIVITY_SIDEBAR_FIELDS } from './resource-activity-page.config';

@Component({
  selector: 'app-resource-activity-page',
  templateUrl: './resource-activity-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
  providers: [ResourceActivityPageService],
})
export class ResourceActivityPageComponent {
  protected service = inject(ResourceActivityPageService);
  readonly columns = PROCESSING_ACTIVITY_COLUMNS;
  readonly sidebarFields = PROCESSING_ACTIVITY_SIDEBAR_FIELDS;

  readonly syntheticStatuses = ['NEW', 'MODIFIED', 'PROCESSED'];
  readonly syntheticStatusLabels: Record<string, string> = {
    NEW: 'activity.status.ingested',
    MODIFIED: 'activity.status.edited',
    PROCESSED: 'activity.status.processed',
  };

  readonly filterColumns: FilterColumnConfig[] = [
    { key: 'date', labelKey: 'activity.filter.date', type: 'date' },
    { key: 'total_duration', labelKey: 'activity.column.duration', type: 'numeric' },
    { key: 'nuclia_tokens', labelKey: 'activity.column.nuclia-tokens', type: 'numeric' },
  ];

  private readonly statusToEventType: Record<string, EventType> = {
    NEW: EventType.NEW,
    MODIFIED: EventType.MODIFIED,
    PROCESSED: EventType.PROCESSED,
  };

  /** Map EventType values back to synthetic status strings for the filter component */
  readonly activeSyntheticStatuses = computed(() => {
    const active = this.service.activeSources();
    return new Set(
      Object.entries(this.statusToEventType)
        .filter(([, eventType]) => active.has(eventType))
        .map(([label]) => label),
    );
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

  onDownloadRequested(event: { format: import('@nuclia/core').DownloadFormat; columns: string[] }): void {
    this.service.download(event.format, event.columns);
  }

  onFiltersApplied(event: FilterApplyEvent): void {
    const sources = (event.syntheticStatuses ?? this.syntheticStatuses)
      .map((s) => this.statusToEventType[s])
      .filter((e): e is EventType => !!e);
    this.service.applyAllFilters(
      sources.length > 0 ? sources : [EventType.NEW, EventType.MODIFIED, EventType.PROCESSED],
      event.numericConditions,
      event.dateConditions ?? [],
    );
  }
}
