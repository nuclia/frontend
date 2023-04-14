import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ModalRef } from '@guillotinaweb/pastanaga-angular';
import { AccountTypes } from '@nuclia/core';
import { Currency, Prices } from '../billing.models';

@Component({
  templateUrl: './review.component.html',
  styleUrls: ['./review.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewComponent {
  cost = this.modal.config.data?.prices.recurring.month.price || '';
  currency = this.modal.config.data?.currency || '';
  budget = this.modal.config.data?.budget || '';
  account = this.modal.config.data?.account || '';

  constructor(public modal: ModalRef<{ account: AccountTypes; prices: Prices; budget: string; currency: Currency }>) {}

  confirm() {
    this.modal.close(true);
  }
}
