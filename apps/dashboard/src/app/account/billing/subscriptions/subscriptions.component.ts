import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy } from '@angular/core';
import { BillingService } from '../billing.service';
import { CalculatorComponent } from '../calculator/calculator.component';
import { combineLatest, map, of, shareReplay, Subject, switchMap, take, tap, takeUntil } from 'rxjs';
import { SisModalService } from '@nuclia/sistema';
import { AccountService, STFTrackingService } from '@flaps/core';
import { Currency } from '../billing.models';
import { WINDOW } from '@ng-web-apis/common';

@Component({
  selector: 'app-subscriptions',
  templateUrl: './subscriptions.component.html',
  styleUrls: ['./subscriptions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubscriptionsComponent implements OnDestroy {
  accountType = this.billing.type.pipe(shareReplay());
  currency?: Currency;
  canSelectCurrency = false;
  prices = this.billing.getPrices().pipe(shareReplay());
  accountTypesDefaults = this.accountService.getAccountTypes().pipe(shareReplay());
  customerCurrency = this.billing
    .getCustomer()
    .pipe(
      switchMap((customer) =>
        customer ? this.billing.getCurrency(customer.billing_details?.country || '') : of(null),
      ),
    );
  unsubscribeAll = new Subject<void>();

  constructor(
    private billing: BillingService,
    private modalService: SisModalService,
    private tracking: STFTrackingService,
    private cdr: ChangeDetectorRef,
    private accountService: AccountService,
    @Inject(WINDOW) private window: Window,
  ) {
    combineLatest([this.customerCurrency, this.billing.initialCurrency])
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe(([currency, initialCurrency]) => {
        if (currency) {
          this.currency = currency;
        } else {
          this.currency = initialCurrency;
          this.canSelectCurrency = true;
        }
        this.cdr.markForCheck();
      });
  }

  openCalculator() {
    this.prices.pipe(take(1)).subscribe((prices) => {
      this.modalService.openModal(CalculatorComponent, {
        dismissable: true,
        data: {
          prices,
          currency: this.currency,
        },
      });
    });
  }

  setCurrency(currency: Currency) {
    this.billing.setInitialCurrency(currency);
  }

  contact() {
    this.window.location.href = 'mailto:support@nuclia.com';
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}
