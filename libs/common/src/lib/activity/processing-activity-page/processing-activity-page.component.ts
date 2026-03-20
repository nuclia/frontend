import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { EventType } from '@nuclia/core';
import { ActivityMonthRange } from '../activity-column.model';
import { FilterApplyEvent, FilterColumnConfig } from '../activity-filters';
import { ProcessingActivityPageService } from './processing-activity-page.service';
import { PROCESSING_ACTIVITY_COLUMNS, PROCESSING_ACTIVITY_SIDEBAR_FIELDS } from './processing-activity-page.config';

@Component({
  selector: 'app-processing-activity-page',
  templateUrl: './processing-activity-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ProcessingActivityPageComponent {
  protected service = inject(ProcessingActivityPageService);
  readonly columns = PROCESSING_ACTIVITY_COLUMNS;
  readonly sidebarFields = PROCESSING_ACTIVITY_SIDEBAR_FIELDS;

  readonly syntheticStatuses = ['NEW', 'MODIFIED', 'PROCESSED'];
  readonly syntheticStatusLabels: Record<string, string> = {
    NEW: 'activity.status.ingested',
    MODIFIED: 'activity.status.edited',
    PROCESSED: 'activity.status.processed',
  };

  readonly filterColumns: FilterColumnConfig[] = [
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
    const result = new Set<string>();
    for (const [label, eventType] of Object.entries(this.statusToEventType)) {
      if (active.has(eventType)) {
        result.add(label);
      }
    }
    return result;
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
    const eventTypes: EventType[] = [];
    if (event.syntheticStatuses) {
      for (const s of event.syntheticStatuses) {
        const et = this.statusToEventType[s];
        if (et !== undefined) eventTypes.push(et);
      }
    }
    this.service.applyAllFilters(
      eventTypes.length > 0 ? eventTypes : [EventType.NEW, EventType.MODIFIED, EventType.PROCESSED],
      event.numericConditions,
    );
  }
}
