import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Currency, Prices, StripeCustomer } from '@flaps/core';
import { ModalRef, PaButtonModule, PaModalModule } from '@guillotinaweb/pastanaga-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { AccountTypes } from '@nuclia/core';
import { COUNTRIES } from '@nuclia/sistema';

@Component({
  templateUrl: './review.component.html',
  styleUrls: ['./review.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PaModalModule, PaButtonModule, DecimalPipe, CurrencyPipe, TranslatePipe],
})
export class ReviewComponent {
  account = this.modal.config.data?.account || '';
  activation = this.modal.config.data?.activation || false;
  prices = this.modal.config.data?.prices;
  monthly = !!this.prices?.recurring?.month;
  currency = this.modal.config.data?.currency || '';
  budget = this.modal.config.data?.budget ?? (this.account === 'cowork' ? null : 500);
  customer = this.modal.config.data?.customer;
  token = this.modal.config.data?.token;
  countries = COUNTRIES;

  constructor(
    public modal: ModalRef<{
      account: AccountTypes;
      activation?: boolean;
      prices: Prices;
      budget: number | null;
      currency: Currency;
      customer: StripeCustomer;
      token: any;
    }>,
  ) {}

  confirm() {
    this.modal.close(true);
  }
}
