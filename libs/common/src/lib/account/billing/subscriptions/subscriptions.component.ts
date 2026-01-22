import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy } from '@angular/core';
import { BehaviorSubject, combineLatest, filter, of, shareReplay, Subject, switchMap, takeUntil } from 'rxjs';
import { AccountService, BillingService, Currency, FeaturesService } from '@flaps/core';
import { SubscriptionService } from '../subscription.service';
import { WINDOW } from '@ng-web-apis/common';
import { AccountTypes } from '@nuclia/core';

@Component({
  selector: 'app-subscriptions',
  templateUrl: './subscriptions.component.html',
  styleUrls: ['./subscriptions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class SubscriptionsComponent implements OnDestroy {
  accountType = this.billing.type.pipe(shareReplay(1));
  currency = new BehaviorSubject<Currency | undefined>(undefined);
  canSelectCurrency = false;
  prices = this.currency.pipe(
    filter((currency) => !!currency),
    switchMap((currency) => this.billing.getPrices(currency)),
    shareReplay(1),
  );
  accountTypesDefaults = this.accountService.getAccountTypes().pipe(shareReplay(1));
  customerCurrency = this.billing
    .getCustomer()
    .pipe(
      switchMap((customer) =>
        customer ? this.billing.getCurrency(customer.billing_details?.country || '') : of(null),
      ),
    );
  // temporarily hiding the starter plan
  disableStarterPlan = true;
  tiers: AccountTypes[] = ['v3starter', 'v3pro', 'v3enterprise'];
  isSubscribedToAws = this.billing.isSubscribedToAws;
  isManuallySubscribed = this.billing.isManuallySubscribed;
  unsubscribeAll = new Subject<void>();
  isTrial = this.features.isTrial;

  constructor(
    private billing: BillingService,
    private cdr: ChangeDetectorRef,
    private accountService: AccountService,
    private subscriptionService: SubscriptionService,
    private features: FeaturesService,
    @Inject(WINDOW) private window: Window,
  ) {
    combineLatest([this.customerCurrency, this.subscriptionService.initialCurrency])
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe(([currency, initialCurrency]) => {
        if (currency) {
          this.currency.next(currency);
        } else {
          this.currency.next(initialCurrency);
          this.canSelectCurrency = true;
        }
        this.cdr.markForCheck();
      });
  }

  setCurrency(currency: Currency) {
    this.subscriptionService.setInitialCurrency(currency);
  }

  contact() {
    window.open('https://www.progress.com/agentic-rag/contact-us', 'blank', 'noreferrer');
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}
