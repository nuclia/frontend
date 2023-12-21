import { ChangeDetectionStrategy, Component, Inject, Input } from '@angular/core';
import { shareReplay } from 'rxjs';
import { AccountService, BillingService, Currency } from '@flaps/core';
import { WINDOW } from '@ng-web-apis/common';

@Component({
  selector: 'app-deprecated-subscriptions',
  templateUrl: './deprecated-subscriptions.component.html',
  styleUrls: ['./deprecated-subscriptions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeprecatedSubscriptionsComponent {
  accountType = this.billing.type.pipe(shareReplay());
  prices = this.billing.getPrices().pipe(shareReplay());
  accountTypesDefaults = this.accountService.getAccountTypes().pipe(shareReplay());
  @Input() currency?: Currency;

  constructor(
    private billing: BillingService,
    private accountService: AccountService,
    @Inject(WINDOW) private window: Window,
  ) {}

  contact() {
    this.window.location.href = 'mailto:support@nuclia.com';
  }
}
