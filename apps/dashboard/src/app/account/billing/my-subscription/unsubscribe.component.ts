import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ModalRef } from '@guillotinaweb/pastanaga-angular';
import { Currency } from '../billing.models';

export interface UnsubscribeModalData {
  currency: Currency;
  overCost: number;
  endBillingPeriod: string;
}

@Component({
  templateUrl: './unsubscribe.component.html',
  styleUrls: ['./unsubscribe.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnsubscribeComponent {
  data = this.modal.config.data;

  constructor(public modal: ModalRef<UnsubscribeModalData>) {}

  confirm() {
    this.modal.close(true);
  }
}
