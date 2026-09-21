import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy } from '@angular/core';
import { BillingService, InvoicesList } from '@flaps/core';
import { concatMap, filter, map, shareReplay, Subject, takeUntil, tap } from 'rxjs';
import { WINDOW } from '@ng-web-apis/common';

const PAGE_SIZE = 25;

@Component({
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class HistoryComponent implements OnDestroy {
  invoices: InvoicesList = { items: [], pagination: { has_more: true } };
  currency$ = this.billingService.getAccountUsage().pipe(
    map((usage) => usage.currency),
    shareReplay(),
  );
  loading = false;
  loadMore = new Subject<void>();
  unsubscribeAll = new Subject<void>();

  constructor(
    private billingService: BillingService,
    private cdr: ChangeDetectorRef,
    @Inject(WINDOW) private window: Window,
  ) {
    this.loadMore
      .pipe(
        filter(() => this.invoices.pagination.has_more && !this.loading),
        tap(() => {
          this.loading = true;
          this.cdr?.markForCheck();
        }),
        concatMap(() => {
          return this.billingService.getInvoices(PAGE_SIZE, this.invoices.items.slice(-1)[0]?.id);
        }),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe((invoices) => {
        this.invoices = { items: [...this.invoices.items, ...invoices.items], pagination: invoices.pagination };
        this.loading = false;
        this.cdr?.markForCheck();
      });
    this.loadInvoices();
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  loadInvoices() {
    this.loadMore.next();
  }

  openPdf(url: string) {
    this.window.open(url, 'blank', 'noreferrer');
  }
}
