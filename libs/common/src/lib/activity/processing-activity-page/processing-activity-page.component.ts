import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { ActivityMonthRange } from '../activity-column.model';
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
}
