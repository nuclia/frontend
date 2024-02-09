import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { combineLatest, filter, map, shareReplay, switchMap, take } from 'rxjs';
import { BillingService, NavigationService, SDKService, SubscriptionStatus } from '@flaps/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { PaButtonModule, PaIconModule } from '@guillotinaweb/pastanaga-angular';
import { differenceInDays } from 'date-fns';
import { SisModalService } from '@nuclia/sistema';
import { WINDOW } from '@ng-web-apis/common';
import { TranslateModule } from '@ngx-translate/core';

const TRIAL_ALERT = 'NUCLIA_TRIAL_ALERT';

@Component({
  selector: 'app-account-status',
  imports: [CommonModule, RouterModule, TranslateModule, PaButtonModule, PaIconModule],
  standalone: true,
  templateUrl: './account-status.component.html',
  styleUrls: ['./account-status.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountStatusComponent {
  accountType = this.sdk.currentAccount.pipe(map((account) => account.type));
  isTrial = this.accountType.pipe(map((type) => type === 'stash-trial'));
  isSubscribed = this.billingService.isSubscribed;
  subscription = this.billingService.getSubscription().pipe(shareReplay());
  upgradeUrl = this.sdk.currentAccount.pipe(map((account) => this.navigation.getUpgradeUrl(account.slug)));
  reactivateUrl = this.sdk.currentAccount.pipe(
    map((account) => `${this.navigation.getBillingUrl(account.slug)}/my-subscription`),
  );
  daysLeft = this.sdk.currentAccount.pipe(
    filter((account) => !!account.trial_expiration_date),
    map((account) => {
      const expiration = new Date(`${account.trial_expiration_date}+00:00`);
      const now = new Date();
      return differenceInDays(expiration, now) + 1;
    }),
  );
  canExtendTrial = combineLatest([this.daysLeft, this.isTrial]).pipe(
    map(([daysLeft, isTrial]) => isTrial && daysLeft <= 5),
  );
  trialExpired = combineLatest([this.sdk.currentAccount, this.isTrial]).pipe(
    map(([account, isTrial]) => {
      if (!isTrial || !account.trial_expiration_date) return false;
      const expiration = new Date(`${account.trial_expiration_date}+00:00`);
      const now = new Date();
      return expiration < now;
    }),
  );
  isCancelScheduled = this.subscription.pipe(
    map((subscription) => subscription?.status === SubscriptionStatus.CANCEL_SCHEDULED),
  );
  subscriptionDaysLeft = this.subscription.pipe(
    map((subscription) => {
      const expiration = new Date(subscription?.end_billing_period || '');
      const now = new Date();
      const difference = differenceInDays(expiration, now) + 1;
      return difference > 0 ? difference : 0;
    }),
  );

  constructor(
    private sdk: SDKService,
    private billingService: BillingService,
    private navigation: NavigationService,
    private modalService: SisModalService,
    private router: Router,
    @Inject(WINDOW) private window: Window,
  ) {
    this.checkIfTrialExpired();
  }

  contact() {
    this.window.location.href = 'mailto:eudald@nuclia.com';
  }

  checkIfTrialExpired() {
    this.trialExpired
      .pipe(
        take(1),
        filter((isExpired) => isExpired),
        switchMap(() => this.sdk.currentAccount.pipe(take(1))),
      )
      .subscribe((account) => {
        const ids = localStorage.getItem(TRIAL_ALERT) || '';
        if (!ids.split(',').includes(account.id)) {
          this.showEndOfTrialAlert();
          localStorage.setItem(TRIAL_ALERT, !ids ? account.id : `${ids},${account.id}`);
        }
      });
  }

  showEndOfTrialAlert() {
    this.modalService
      .openConfirm({
        title: 'account.free_trial_ended.title',
        description: 'account.free_trial_ended.description',
        cancelLabel: 'billing.contact',
        confirmLabel: 'billing.upgrade',
      })
      .onClose.pipe(
        take(1),
        switchMap((result) =>
          this.upgradeUrl.pipe(
            take(1),
            map((upgradeUrl) => ({ result, upgradeUrl })),
          ),
        ),
      )
      .subscribe(({ result, upgradeUrl }) => {
        if (result === true) {
          this.router.navigate([upgradeUrl]);
        } else if (result === false) {
          this.contact();
        }
      });
  }
}
