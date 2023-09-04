import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { ModalRef } from '@guillotinaweb/pastanaga-angular';
import { map } from 'rxjs';
import { Currency, Prices, UsageType } from '../billing.models';
import { BillingService } from '../billing.service';
import { AccountTypes } from '@nuclia/core';
import { asUsageType } from '../utils';

export interface CalculatorModalData {
  prices: { [key in AccountTypes]: Prices };
  currency: Currency;
}

@Component({
  selector: 'app-calculator',
  templateUrl: './calculator.component.html',
  styleUrls: ['./calculator.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalculatorComponent {
  params: UsageType[] = [
    'media',
    'paragraphs_processed',
    'searches',
    'predict',
    'generative',
    'paragraphs',
    'training',
  ];
  prices: { [key in AccountTypes]: Prices } = this.modal.config.data!.prices;
  currency: Currency = this.modal.config.data!.currency;
  tier: AccountTypes = 'stash-starter';
  selfHosted = false;

  values: { [param in UsageType]: number } = this.params.reduce(
    (acc, param) => ({ ...acc, [param]: this.prices[this.tier].usage[param].threshold }),
    {} as { [param in UsageType]: number },
  );

  searchPrices = ['stash-starter', 'stash-growth'].reduce(
    (acc, accountType) => {
      const type = accountType as AccountTypes;
      acc[type] = {
        self_hosted: {
          searches: 2 * this.prices[type].usage['predict'].price,
          generative: 2 * this.prices[type].usage['predict'].price + this.prices[type].usage['generative'].price,
        },
        managed: {
          searches: this.prices[type].usage['searches'].price + 2 * this.prices[type].usage['predict'].price,
          generative:
            this.prices[type].usage['searches'].price +
            2 * this.prices[type].usage['predict'].price +
            this.prices[type].usage['generative'].price,
        },
      };
      return acc;
    },
    {} as { [type in AccountTypes]: { self_hosted: any; managed: any } },
  );

  total = this.calculateTotal();
  isSpain = this.billing.country.pipe(map((country) => country === 'ES'));

  constructor(
    public modal: ModalRef<CalculatorModalData>,
    private billing: BillingService,
    private cdr: ChangeDetectorRef,
  ) {}

  update(param: UsageType, value: number) {
    this.values[param] = value;
    this.total = this.calculateTotal();
    this.cdr?.markForCheck();
  }

  toggleSelfHosted() {
    this.selfHosted = !this.selfHosted;
    this.total = this.calculateTotal();
    this.cdr?.markForCheck();
  }

  maxValue(price: number, threshold: number) {
    return Math.ceil(300 / price + threshold);
  }

  calculatePrice(param: UsageType) {
    return (this.values[param] - this.prices[this.tier].usage[param].threshold) * this.getUnitPrice(this.tier, param);
  }

  calculateTotal() {
    return this.params.reduce((acc, current) => acc + this.calculatePrice(current), 0);
  }

  getUnitPrice(tier: AccountTypes, param: UsageType) {
    if (param === 'searches' || param === 'generative') {
      return this.searchPrices[tier][this.selfHosted ? 'self_hosted' : 'managed'][param];
    } else {
      return this.prices[tier].usage[param].price;
    }
  }

  changeTier(tier: AccountTypes) {
    this.tier = tier;
    this.cdr?.markForCheck();
    // wait until the new slider range is properly set
    setTimeout(() => {
      Object.keys(this.values).forEach((param) => {
        this.update(param as UsageType, this.prices[tier].usage[param as UsageType].threshold);
      });
    });
  }

  save() {
    this.billing.setBudgetEstimation(this.total);
    this.modal.close();
  }

  protected readonly asUsageType = asUsageType;
}
