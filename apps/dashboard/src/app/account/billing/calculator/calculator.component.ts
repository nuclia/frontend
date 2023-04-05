import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { ModalRef } from '@guillotinaweb/pastanaga-angular';
import { map } from 'rxjs';
import { Currency, Prices, UsageType } from '../billing.models';
import { BillingService } from '../billing.service';

@Component({
  selector: 'app-calculator',
  templateUrl: './calculator.component.html',
  styleUrls: ['./calculator.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalculatorComponent {
  params: UsageType[] = ['media', 'files', 'searches', 'qa', 'training-hours'];
  prices = this.modal.config.data!.prices;
  currency = this.modal.config.data!.currency;

  values = this.params.reduce((acc, param) => {
    acc[param] = 0;
    return acc;
  }, {} as { [param in UsageType]: number });

  total = this.calculateTotal();
  isSpain = this.billing.country.pipe(map((country) => country === 'ES'));

  constructor(
    public modal: ModalRef<{ prices: Prices; currency: Currency }>,
    private billing: BillingService,
    private cdr: ChangeDetectorRef,
  ) {}

  update(param: UsageType, value: number) {
    this.values[param] = value;
    this.total = this.calculateTotal();
    this.cdr?.markForCheck();
  }

  calculatePrice(param: UsageType) {
    return this.values[param] * this.prices.usage[param].price;
  }

  calculateTotal() {
    return this.params.reduce((acc, current) => acc + this.calculatePrice(current), 0);
  }

  save() {
    this.billing.setBudgetEstimation(this.total);
    this.modal.close();
  }
}
