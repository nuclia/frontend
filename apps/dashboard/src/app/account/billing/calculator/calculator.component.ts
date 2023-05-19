import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { ModalRef } from '@guillotinaweb/pastanaga-angular';
import { map } from 'rxjs';
import { Currency, Prices, UsageType } from '../billing.models';
import { BillingService } from '../billing.service';
import { AccountTypes } from '@nuclia/core';

@Component({
  selector: 'app-calculator',
  templateUrl: './calculator.component.html',
  styleUrls: ['./calculator.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalculatorComponent {
  params: UsageType[] = ['media', 'files', 'searches', 'qa', 'training'];
  prices = this.modal.config.data!.prices;
  currency = this.modal.config.data!.currency;
  tier: AccountTypes = 'stash-developer';

  values = this.params.reduce(
    (acc, param) => ({ ...acc, [param]: this.prices[this.tier].usage[param].threshold }),
    {} as { [param in UsageType]: number },
  );

  total = this.calculateTotal();
  isSpain = this.billing.country.pipe(map((country) => country === 'ES'));

  constructor(
    public modal: ModalRef<{ prices: { [key in AccountTypes]: Prices }; currency: Currency }>,
    private billing: BillingService,
    private cdr: ChangeDetectorRef,
  ) {}

  update(param: UsageType, value: number) {
    this.values[param] = value;
    this.total = this.calculateTotal();
    this.cdr?.markForCheck();
  }

  calculatePrice(param: UsageType) {
    return (
      (this.values[param] - this.prices[this.tier].usage[param].threshold) * this.prices[this.tier].usage[param].price
    );
  }

  calculateTotal() {
    return this.params.reduce((acc, current) => acc + this.calculatePrice(current), 0);
  }

  changeTier(tier: AccountTypes) {
    this.tier = tier;
    Object.keys(this.values).forEach((param) => {
      this.update(param as UsageType, this.prices[tier].usage[param as UsageType].threshold);
    });
  }

  save() {
    this.billing.setBudgetEstimation(this.total);
    this.modal.close();
  }
}
