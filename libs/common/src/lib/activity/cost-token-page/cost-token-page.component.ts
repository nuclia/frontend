import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivityMonthRange } from '../activity-column.model';
import { CostTokenPageService } from './cost-token-page.service';
import { COST_TOKEN_COLUMNS, COST_TOKEN_SIDEBAR_FIELDS } from './cost-token-page.config';

@Component({
  selector: 'app-cost-token-page',
  templateUrl: './cost-token-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class CostTokenPageComponent {
  protected service = inject(CostTokenPageService);
  readonly columns = COST_TOKEN_COLUMNS;
  readonly sidebarFields = COST_TOKEN_SIDEBAR_FIELDS;

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
