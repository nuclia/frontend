import { ChangeDetectionStrategy, Component, Inject, Input } from '@angular/core';
import { combineLatest, filter, map, of, shareReplay } from 'rxjs';
import { SDKService, STFTrackingService } from '@flaps/core';
import { NavigationService } from '@flaps/common';
import { BillingService } from '../billing/billing.service';
import { AccountUsage } from '../billing/billing.models';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PaButtonModule, PaTranslateModule } from '@guillotinaweb/pastanaga-angular';
import { differenceInDays } from 'date-fns';
import { AccountBlockingState } from '@nuclia/core';
import { WINDOW } from '@ng-web-apis/common';

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
  trialAccount = this.accountType.pipe(map((type) => type === 'stash-trial'));
  currency = this.billingService.getAccountUsage().pipe(map((usage) => usage.currency));
  price = combineLatest([this.billingService.getPrices(), this.accountType]).pipe(
    map(([prices, accountType]) => prices?.[accountType]?.recurring.month.price),
  );
  upgradeUrl = this.sdk.currentAccount.pipe(
    map((account) => this.navigation.getAccountManageUrl(account.slug) + '/billing/subscriptions'),
  );
  blocked = this.sdk.currentAccount.pipe(map((account) => account.blocking_state === AccountBlockingState.QUOTA));
  isBillingEnabled = this.tracking.isFeatureEnabled('billing').pipe(shareReplay(1));
  daysLeft = this.sdk.currentAccount.pipe(
    filter((account) => !!account.trial_expiration_date),
    map((account) => {
      const expiration = new Date(`${account.trial_expiration_date}+00:00`);
      const now = new Date();
      return differenceInDays(expiration, now);
    }),
  );
  canExtendTrial = combineLatest([this.daysLeft, this.trialAccount]).pipe(
    map(([daysLeft, isTrial]) => isTrial && daysLeft <= 5),
  );

  constructor(
    private sdk: SDKService,
    private billingService: BillingService,
    private navigation: NavigationService,
    private tracking: STFTrackingService,
    @Inject(WINDOW) private window: Window,
  ) {}

  getCurrency() {
    return this.usage ? of(this.usage.currency) : this.currency;
  }

  contact() {
    this.window.location.href = 'mailto:eudald@nuclia.com';
  }
}
