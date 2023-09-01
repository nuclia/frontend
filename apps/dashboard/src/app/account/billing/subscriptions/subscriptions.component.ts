import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject } from '@angular/core';
import { BillingService } from '../billing.service';
import { CalculatorComponent } from '../calculator/calculator.component';
import { forkJoin, shareReplay, take, tap } from 'rxjs';
import { SisModalService } from '@nuclia/sistema';
import { AccountService, STFTrackingService } from '@flaps/core';
import { COUNTRIES } from '../utils';
import { Currency } from '../billing.models';
import { WINDOW } from '@ng-web-apis/common';
import { DeprecatedCalculatorComponent } from '../calculator/deprecated-calculator.component';

@Component({
  selector: 'app-subscriptions',
  templateUrl: './subscriptions.component.html',
  styleUrls: ['./subscriptions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubscriptionsComponent {
  accountType = this.billing.type.pipe(shareReplay());
  countryList = Object.entries(COUNTRIES)
    .map(([code, name]) => ({ code, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
  currency?: Currency;
  prices = this.billing.getPrices().pipe(shareReplay());
  accountTypesDefaults = this.accountService.getAccountTypes().pipe(shareReplay());
  showNewTiers = this.tracking.isFeatureEnabled('new-tiers');

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
        this.onSelectCountry(customer.billing_details.country);
      } else if (country) {
        this.onSelectCountry(country);
      }
    });
  }

  openCalculator() {
    forkJoin([this.prices.pipe(take(1)), this.showNewTiers.pipe(take(1))]).subscribe(([prices, showNewTiers]) => {
      this.modalService.openModal(showNewTiers ? CalculatorComponent : DeprecatedCalculatorComponent, {
        dismissable: true,
        data: {
          prices,
          currency: this.currency,
        },
      });
    });
  }

  onSelectCountry(country: string) {
    this.billing.setCountry(country);
    this.billing
      .getCurrency(country)
      .pipe(tap((currency) => (this.currency = currency)))
      .subscribe(() => this.cdr.markForCheck());
  }

  contact() {
    this.window.location.href = 'mailto:support@nuclia.com';
  }
}
