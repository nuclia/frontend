import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject } from '@angular/core';
import { BillingService } from '../billing.service';
import { forkJoin, shareReplay, take, tap } from 'rxjs';
import { SisModalService } from '@nuclia/sistema';
import { AccountService, STFTrackingService } from '@flaps/core';
import { Currency } from '../billing.models';
import { WINDOW } from '@ng-web-apis/common';

@Component({
  selector: 'app-deprecated-tiers',
  templateUrl: './deprecated-tiers.component.html',
  styleUrls: ['./deprecated-tiers.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeprecatedTiersComponent {
  accountType = this.billing.type.pipe(shareReplay());
  currency?: Currency;
  prices = this.billing.getPrices().pipe(shareReplay());
  accountTypesDefaults = this.accountService.getAccountTypes().pipe(shareReplay());

  constructor(
    private billing: BillingService,
    private modalService: SisModalService,
    private tracking: STFTrackingService,
    private cdr: ChangeDetectorRef,
    private accountService: AccountService,
    @Inject(WINDOW) private window: Window,
  ) {
    forkJoin([this.billing.getCustomer(), this.billing.country.pipe(take(1))]).subscribe(([customer, country]) => {
      if (customer) {
        this.setCurrency(customer.billing_details.country);
      } else if (country) {
        this.setCurrency(country);
      }
    });
  }

  setCurrency(country: string) {
    this.billing
      .getCurrency(country)
      .pipe(tap((currency) => (this.currency = currency)))
      .subscribe(() => this.cdr.markForCheck());
  }

  contact() {
    this.window.location.href = 'mailto:support@nuclia.com';
  }
}
