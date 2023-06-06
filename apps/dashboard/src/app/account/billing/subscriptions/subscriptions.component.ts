import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject } from '@angular/core';
import { BillingService } from '../billing.service';
import { CalculatorComponent } from '../calculator/calculator.component';
import { forkJoin, shareReplay, take, tap } from 'rxjs';
import { SisModalService } from '@nuclia/sistema';
import { AccountService, STFTrackingService } from '@flaps/core';
import { COUNTRIES } from '../utils';
import { Currency } from '../billing.models';
import { WINDOW } from '@ng-web-apis/common';

@Component({
  selector: 'app-subscriptions',
  templateUrl: './subscriptions.component.html',
  styleUrls: ['./subscriptions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubscriptionsComponent {
  isCalculatorEnabled = this.tracking.isFeatureEnabled('calculator').pipe(shareReplay());
  accountType = this.billing.type.pipe(shareReplay());
  countryList = Object.entries(COUNTRIES)
    .map(([code, name]) => ({ code, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
  currency?: Currency;
  prices = this.billing.getPrices().pipe(shareReplay());
  accountTypesDefaults = this.accountService.getAccountTypes().pipe(shareReplay());
  isSubscribed = this.billing.isSubscribed;

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
    this.prices.pipe(take(1)).subscribe((prices) => {
      this.modalService.openModal(CalculatorComponent, {
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
    this.window.location.href = 'mailto:billing@nuclia.com';
  }

  cancel() {
    this.window.open('https://tr1ow02y4vw.typeform.com/to/zOiVFwJU', '_blank', 'noreferrer,noopener');
  }
}
