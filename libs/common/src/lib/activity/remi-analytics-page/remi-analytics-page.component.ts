import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RemiAnswerStatus } from '@nuclia/core';
import { RemiAnalyticsPageService } from './remi-analytics-page.service';

@Component({
  selector: 'app-remi-analytics-page',
  templateUrl: './remi-analytics-page.component.html',
  styleUrl: './remi-analytics-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class RemiAnalyticsPageComponent {
  protected service = inject(RemiAnalyticsPageService);
  private datePipe = inject(DatePipe);

  readonly selectedMonth = signal('');

  readonly statuses: { value: RemiAnswerStatus; label: string }[] = [
    { value: 'SUCCESS', label: 'activity.remi-analytics.status.success' },
    { value: 'ERROR', label: 'activity.remi-analytics.status.error' },
    { value: 'NO_CONTEXT', label: 'activity.remi-analytics.status.no-context' },
  ];

  constructor() {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    this.selectedMonth.set(currentMonth);
    this.service.loadData(currentMonth);
  }

  onMonthChange(value: string): void {
    if (value) {
      this.selectedMonth.set(value);
      this.service.loadData(value, this.service.activeStatus());
    }
  }

  onStatusChange(status: RemiAnswerStatus): void {
    this.service.setStatus(status);
  }

  onLoadMore(): void {
    this.service.loadNextPage();
  }

  formatMonth(yyyyMM: string): string {
    const [year, month] = yyyyMM.split('-');
    const d = new Date(Number(year), Number(month) - 1, 1);
    return this.datePipe.transform(d, 'MMM yyyy') ?? yyyyMM;
  }
}
