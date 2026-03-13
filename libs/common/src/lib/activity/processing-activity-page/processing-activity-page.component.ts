import {
  ChangeDetectionStrategy,
  Component,
  ViewChild,
  inject,
} from '@angular/core';
import { ActivityMonthRange } from '../activity-column.model';
import { ActivityLogPageComponent } from '../activity-log-page.component';
import { ProcessingActivityPageService } from './processing-activity-page.service';
import { PROCESSING_ACTIVITY_COLUMNS } from './processing-activity-page.config';

@Component({
  selector: 'app-processing-activity-page',
  templateUrl: './processing-activity-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ProcessingActivityPageComponent {
  protected service = inject(ProcessingActivityPageService);
  readonly columns = PROCESSING_ACTIVITY_COLUMNS;

  @ViewChild(ActivityLogPageComponent) private logPage?: ActivityLogPageComponent;

  constructor() {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    this.service.loadData(currentMonth);
  }

  onMonthRangeChange(range: ActivityMonthRange): void {
    this.service.loadData(range.from);
  }

  filterByStatus(status: string): void {
    this.service.filterByStatus(status);
    if (this.logPage) {
      this.logPage.service.updateSearchMode('status');
      this.logPage.service.updateSearchTerm(status);
    }
  }

  clearStatusFilter(): void {
    this.service.clearStatusFilter();
    if (this.logPage) {
      this.logPage.service.updateSearchMode('');
      this.logPage.service.updateSearchTerm('');
    }
  }
}
