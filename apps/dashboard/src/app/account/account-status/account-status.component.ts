import { ChangeDetectionStrategy, Component, Inject, Input } from '@angular/core';
import { combineLatest, filter, map, of, switchMap, shareReplay, take } from 'rxjs';
import { SDKService, STFTrackingService } from '@flaps/core';
import { NavigationService } from '@flaps/common';
import { BillingService } from '../billing/billing.service';
import { AccountUsage } from '../billing/billing.models';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { PaButtonModule, PaTranslateModule } from '@guillotinaweb/pastanaga-angular';
import { differenceInDays } from 'date-fns';
import { SisModalService } from '@nuclia/sistema';
import { WINDOW } from '@ng-web-apis/common';

const TRIAL_ALERT = 'NUCLIA_TRIAL_ALERT';

@Component({
  selector: 'app-account-status',
  imports: [CommonModule, RouterModule, PaTranslateModule, PaButtonModule],
  standalone: true,
  templateUrl: './account-status.component.html',
  styleUrls: ['./account-status.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountStatusComponent {
  @Input() usage?: AccountUsage;

  accountType = this.sdk.currentAccount.pipe(map((account) => account.type));
  isTrial = this.accountType.pipe(map((type) => type === 'stash-trial'));
  currency = this.billingService.getAccountUsage().pipe(map((usage) => usage.currency));
  price = combineLatest([this.billingService.getPrices(), this.accountType]).pipe(
    map(([prices, accountType]) => prices?.[accountType]?.recurring.month.price),
  );
  upgradeUrl = this.sdk.currentAccount.pipe(
    map((account) => this.navigation.getAccountManageUrl(account.slug) + '/billing/subscriptions'),
  );
  isBillingEnabled = this.tracking.isFeatureEnabled('billing').pipe(shareReplay(1));
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

  constructor(
    private sdk: SDKService,
    private billingService: BillingService,
    private navigation: NavigationService,
    private tracking: STFTrackingService,
    private modalService: SisModalService,
    private router: Router,
    @Inject(WINDOW) private window: Window,
  ) {
    this.checkIfTrialExpired();
  }

  getCurrency() {
    return this.usage ? of(this.usage.currency) : this.currency;
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
