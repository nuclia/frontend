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
  disabledOnPrem = ['searches', 'paragraphs'];
  prices: { [key in AccountTypes]: Prices } = this.modal.config.data!.prices;
  currency: Currency = this.modal.config.data!.currency;
  tier: AccountTypes = 'stash-starter';
  mode: 'cloud' | 'on-prem' = 'cloud';

  values: { [param in UsageType]: number } = this.params.reduce(
    (acc, param) => ({ ...acc, [param]: this.prices[this.tier].usage[param].threshold }),
    {} as { [param in UsageType]: number },
  );

  total = this.calculateTotal();
  isSpain = this.billing.country.pipe(map((country) => country === 'ES'));
  isSubscribed = this.billing.isSubscribed;

  constructor(
    public modal: ModalRef<CalculatorModalData>,
    private billing: BillingService,
    private cdr: ChangeDetectorRef,
  ) {}

  get disabledParams() {
    return this.mode === 'on-prem' ? this.disabledOnPrem : [];
  }

  update(param: UsageType, value: number) {
    this.values[param] = value;
    this.total = this.calculateTotal();
    this.cdr?.markForCheck();
  }

  onModeChange() {
    this.total = this.calculateTotal();
    this.cdr?.markForCheck();
  }

  maxValue(price: number, threshold: number) {
    return Math.ceil(300 / price + threshold);
  }

  calculatePrice(param: UsageType) {
    return (
      (this.values[param] - this.prices[this.tier].usage[param].threshold) * this.prices[this.tier].usage[param].price
    );
  }

  calculateTotal() {
    return this.params
      .filter((param) => !this.disabledParams.includes(param))
      .reduce((acc, current) => acc + this.calculatePrice(current), 0);
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
