import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { combineLatest, map, of, shareReplay } from 'rxjs';
import { SDKService, STFTrackingService } from '@flaps/core';
import { NavigationService } from '@flaps/common';
import { BillingService } from '../billing/billing.service';
import { AccountUsage } from '../billing/billing.models';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PaButtonModule, PaTranslateModule } from '@guillotinaweb/pastanaga-angular';

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
  isBillingEnabled = this.tracking.isFeatureEnabled('billing').pipe(shareReplay(1));

  constructor(
    private sdk: SDKService,
    private billingService: BillingService,
    private navigation: NavigationService,
    private tracking: STFTrackingService,
  ) {}

  getCurrency() {
    return this.usage ? of(this.usage.currency) : this.currency;
  }
}
