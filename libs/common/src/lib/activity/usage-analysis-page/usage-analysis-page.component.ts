import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivityMonthRange } from '../activity-column.model';
import { UsageAnalysisPageService } from './usage-analysis-page.service';
import { USAGE_ANALYSIS_COLUMNS } from './usage-analysis-page.config';

@Component({
  selector: 'app-usage-analysis-page',
  templateUrl: './usage-analysis-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class UsageAnalysisPageComponent {
  protected service = inject(UsageAnalysisPageService);
  readonly columns = USAGE_ANALYSIS_COLUMNS;

  constructor() {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    this.service.loadData(currentMonth);
  }

  onMonthRangeChange(range: ActivityMonthRange): void {
    this.service.loadData(range.from);
  }
}
