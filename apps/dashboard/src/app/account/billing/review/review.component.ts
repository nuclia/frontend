import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ModalRef } from '@guillotinaweb/pastanaga-angular';
import { AccountTypes } from '@nuclia/core';
import { Currency, Prices, StripeCustomer } from '../billing.models';
import { COUNTRIES } from '../utils';

@Component({
  templateUrl: './review.component.html',
  styleUrls: ['./review.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewComponent {
  account = this.modal.config.data?.account || '';
  cost = this.modal.config.data?.prices.recurring.month.price || '';
  currency = this.modal.config.data?.currency || '';
  budget = this.modal.config.data?.budget || '';
  customer = this.modal.config.data?.customer;
  token = this.modal.config.data?.token;
  countries = COUNTRIES;

  constructor(
    public modal: ModalRef<{
      account: AccountTypes;
      prices: Prices;
      budget: string;
      currency: Currency;
      customer: StripeCustomer;
      token: any;
    }>,
  ) {}

  confirm() {
    this.modal.close(true);
  }
}
