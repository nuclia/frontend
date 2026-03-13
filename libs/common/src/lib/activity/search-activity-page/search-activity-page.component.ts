import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivityMonthRange } from '../activity-column.model';
import { SearchActivityPageService } from './search-activity-page.service';
import { SEARCH_ACTIVITY_COLUMNS } from './search-activity-page.config';

@Component({
  selector: 'app-search-activity-page',
  templateUrl: './search-activity-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class SearchActivityPageComponent {
  protected service = inject(SearchActivityPageService);
  readonly columns = SEARCH_ACTIVITY_COLUMNS;

  constructor() {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    this.service.loadData(currentMonth);
  }

  onMonthRangeChange(range: ActivityMonthRange): void {
    this.service.loadData(range.from);
  }
}
