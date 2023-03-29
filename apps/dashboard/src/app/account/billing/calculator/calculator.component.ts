import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { ModalRef } from '@guillotinaweb/pastanaga-angular';

@Component({
  selector: 'app-calculator',
  templateUrl: './calculator.component.html',
  styleUrls: ['./calculator.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalculatorComponent {
  // TODO: this data will come from the API
  params: { [param: string]: { min: number; max: number; unitPrice: number } } = {
    hours: { min: 1000, max: 10000, unitPrice: 2.1 },
    documents: { min: 10, max: 500, unitPrice: 10 },
    searches: { min: 1000, max: 5000, unitPrice: 0.5 },
    hosting: { min: 1000, max: 10000, unitPrice: 2.14 },
  };

  values: { [param: string]: number } = {
    hours: this.params.hours.min,
    documents: this.params.documents.min,
    searches: this.params.searches.min,
    hosting: this.params.hosting.min,
  };

  selfHosting = false;
  total = this.calculateTotal();

  constructor(public modal: ModalRef, private cdr: ChangeDetectorRef) {}

  update(param: string, value: number) {
    this.values[param] = value;
    this.total = this.calculateTotal();
    this.cdr?.markForCheck();
  }

  toggleHosting() {
    this.selfHosting = !this.selfHosting;
    this.total = this.calculateTotal();
    this.cdr?.markForCheck();
  }

  calculatePrice(param: string) {
    return ((this.values[param] - this.params[param].min) * this.params[param].unitPrice).toLocaleString(undefined, {
      maximumFractionDigits: 2,
    });
  }

  calculateTotal() {
    const total = Object.keys(this.params)
      .filter((param) => !(param === 'hosting' && this.selfHosting))
      .reduce(
        (acc, current) => acc + (this.values[current] - this.params[current].min) * this.params[current].unitPrice,
        0,
      );
    return total.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
}
