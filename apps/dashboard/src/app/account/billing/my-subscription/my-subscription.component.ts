import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { SisModalService, SisToastService } from '@nuclia/sistema';
import { combineLatest, filter, forkJoin, map, shareReplay, switchMap, take } from 'rxjs';
import {
  AccountService,
  BillingService,
  BillingUsageType,
  NavigationService,
  RecurrentPriceInterval,
  SDKService,
  SubscriptionStatus,
} from '@flaps/core';
import { ModalConfig } from '@guillotinaweb/pastanaga-angular';
import { UnsubscribeComponent, UnsubscribeModalData } from './unsubscribe.component';

@Component({
  templateUrl: './my-subscription.component.html',
  styleUrls: ['./my-subscription.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class MySubscriptionComponent {
  type = this.billingService.type;
  usage = this.billingService.getAccountUsage().pipe(shareReplay(1));
  currency$ = this.usage.pipe(map((usage) => usage.currency));
  prices$ = this.currency$.pipe(
    take(1),
    switchMap((currency) => forkJoin([this.billingService.getPrices(currency), this.type.pipe(take(1))])),
    map(([prices, type]) => prices[type]),
    shareReplay(1),
  );
  defaults = combineLatest([this.accountService.getAccountTypes(), this.type]).pipe(
    map(([defaults, type]) => defaults[type]),
    shareReplay(1),
  );
  subscription = this.billingService.getStripeSubscription().pipe(shareReplay(1));
  activeSubscription = this.subscription.pipe(
    map((subscription) => subscription?.status === SubscriptionStatus.ACTIVE),
  );
  cancelScheduled = this.subscription.pipe(
    map((subscription) => subscription?.status === SubscriptionStatus.CANCEL_SCHEDULED),
  );
  monthly = this.subscription.pipe(
    map((subscription) => subscription?.billing_interval === RecurrentPriceInterval.MONTH),
  );
  isDeprecatedAccount = this.billingService.isDeprecatedAccount;
  doNotShowPrice = ['v3growth', 'v3enterprise'];
  params: BillingUsageType[] = [
    'media',
    'paragraphs_processed',
    'searches',
    'predict',
    'generative',
    'paragraphs',
    'training',
  ];

  constructor(
    private modalService: SisModalService,
    private billingService: BillingService,
    private accountService: AccountService,
    private sdk: SDKService,
    private router: Router,
    private toaster: SisToastService,
    private navigation: NavigationService,
  ) {}

  delete() {
    combineLatest([
      this.currency$,
      this.usage.pipe(map((usage) => usage.over_cost)),
      this.subscription.pipe(map((subscription) => subscription?.end_billing_period)),
    ])
      .pipe(
        take(1),
        switchMap(
          ([currency, overCost, endBillingPeriod]) =>
            this.modalService.openModal(
              UnsubscribeComponent,
              new ModalConfig<UnsubscribeModalData>({
                data: { currency, overCost, endBillingPeriod: endBillingPeriod || '' },
              }),
            ).onClose,
        ),
        filter((result) => result),
        switchMap(() => this.sdk.currentAccount.pipe(take(1))),
      )
      .subscribe((account) => {
        this.router.navigate(['/feedback'], { queryParams: { account: account.slug } });
      });
  }

  reactivate() {
    this.billingService.reactivateSubscription().subscribe(() => {
      this.reloadRoute();
      this.toaster.success('billing.subscription-renewed');
    });
  }

  reloadRoute() {
    const currentUrl = this.router.url;
    this.router.navigate([this.navigation.getAccountUrl]).then(() => {
      this.router.navigate([currentUrl]);
    });
  }
}
