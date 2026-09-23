import { AsyncPipe, CurrencyPipe, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import {
  AccountService,
  BillingService,
  Currency,
  FeaturesService,
  NavigationService,
  SDKService,
  STFPipesModule,
} from '@flaps/core';
import { PaButtonModule, PaIconModule } from '@guillotinaweb/pastanaga-angular';
import { WINDOW } from '@ng-web-apis/common';
import { TranslatePipe } from '@ngx-translate/core';
import { AccountTypes } from '@nuclia/core';
import {
  BehaviorSubject,
  combineLatest,
  filter,
  map,
  Observable,
  of,
  shareReplay,
  Subject,
  switchMap,
  take,
  takeUntil,
} from 'rxjs';
import { SubscriptionService } from '../subscription.service';
import { AwsSubscriptionComponent } from './aws-subscription/aws-subscription.component';
import { ManualSubscriptionComponent } from './manual-subscription/manual-subscription.component';

@Component({
  selector: 'app-subscriptions',
  templateUrl: './subscriptions.component.html',
  styleUrls: ['./subscriptions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AwsSubscriptionComponent,
    ManualSubscriptionComponent,
    PaButtonModule,
    NgTemplateOutlet,
    PaIconModule,
    AsyncPipe,
    CurrencyPipe,
    TranslatePipe,
    STFPipesModule,
  ],
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
  isSubscribedToAws = this.billing.isSubscribedToAws;
  isManuallySubscribed = this.billing.isManuallySubscribed;
  unsubscribeAll = new Subject<void>();
  isTrial = this.features.isTrial;
  workflow = this.sdk.currentAccount.pipe(map((account) => account.workflow));
  tiers: Observable<AccountTypes[]> = combineLatest([this.workflow, this.accountType]).pipe(
    map(([workflow, type]) =>
      workflow === 'cowork' || type === 'cowork' ? ['cowork'] : ['v3starter', 'v3pro', 'v3enterprise'],
    ),
  );
  showCowork = this.tiers.pipe(map((tiers) => tiers.includes('cowork')));

  constructor(
    private billing: BillingService,
    private cdr: ChangeDetectorRef,
    private accountService: AccountService,
    private subscriptionService: SubscriptionService,
    private features: FeaturesService,
    private sdk: SDKService,
    private navigation: NavigationService,
    private router: Router,
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

  goToPaymentDetails(type: AccountTypes) {
    this.sdk.currentAccount.pipe(take(1)).subscribe((account) => {
      this.router.navigate([`${this.navigation.getAccountManageUrl(account.slug)}/billing/checkout`], {
        queryParams: { type },
      });
    });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}
