import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { PaButtonModule, PaDropdownModule, PaIconModule } from '@guillotinaweb/pastanaga-angular';
import { DropdownButtonComponent } from '@nuclia/sistema';
import { METRICS_PAGE_SIZES } from '../metrics.config';

@Component({
  selector: 'app-metrics-pagination',
  imports: [TranslateModule, PaButtonModule, PaIconModule, PaDropdownModule, DropdownButtonComponent],
  templateUrl: './metrics-pagination.component.html',
  styleUrl: './metrics-pagination.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MetricsPaginationComponent {
  readonly page = input.required<number>();
  readonly pageSize = input.required<number>();
  readonly totalItems = input.required<number>();
  /** True when the API has more items beyond what's already loaded. */
  readonly hasMore = input<boolean>(false);

  readonly pageChange = output<number>();
  readonly pageSizeChange = output<number>();

  readonly pageSizes = METRICS_PAGE_SIZES;

  readonly from = computed(() => (this.totalItems() === 0 ? 0 : this.page() * this.pageSize() + 1));
  readonly to = computed(() => Math.min((this.page() + 1) * this.pageSize(), this.totalItems()));

  /** True when we're on the last loaded page and there's no more data to fetch. */
  readonly isLastPage = computed(() => {
    const loadedPages = Math.ceil(this.totalItems() / this.pageSize());
    return this.page() >= loadedPages - 1 && !this.hasMore();
  });

  goTo(page: number): void {
    this.pageChange.emit(page);
  }
}
