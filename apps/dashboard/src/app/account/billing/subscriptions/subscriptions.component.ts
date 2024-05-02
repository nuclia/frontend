import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy } from '@angular/core';
import { combineLatest, of, shareReplay, Subject, switchMap, takeUntil } from 'rxjs';
import { AccountService, BillingService, Currency } from '@flaps/core';
import { SubscriptionService, TOKENS_PER_REQUEST } from '../subscription.service';
import { WINDOW } from '@ng-web-apis/common';
import { AccountTypes } from '@nuclia/core';

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
  tokensPerRequest = TOKENS_PER_REQUEST;
  // temporarily hiding the starter plan
  disableStarterPlan = true;
  tiers: AccountTypes[] = this.disableStarterPlan
    ? ['v3fly', 'v3growth', 'v3enterprise']
    : ['v3starter', 'v3fly', 'v3growth', 'v3enterprise'];
  isSubscribedToAws = this.billing.isSubscribedToAws;
  unsubscribeAll = new Subject<void>();

  constructor(
    private billing: BillingService,
    private cdr: ChangeDetectorRef,
    private accountService: AccountService,
    private subscriptionService: SubscriptionService,
    @Inject(WINDOW) private window: Window,
  ) {
    combineLatest([this.customerCurrency, this.subscriptionService.initialCurrency])
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

  setCurrency(currency: Currency) {
    this.subscriptionService.setInitialCurrency(currency);
  }

  contact() {
    this.window.location.href = 'mailto:sales@nuclia.com';
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}
