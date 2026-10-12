import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Currency } from '@flaps/core';
import { ModalRef, PaButtonModule, PaDateTimeModule, PaModalModule } from '@guillotinaweb/pastanaga-angular';
import { TranslatePipe } from '@ngx-translate/core';

export interface UnsubscribeModalData {
  currency: Currency;
  overCost: number;
  endBillingPeriod: string;
}

@Component({
  templateUrl: './unsubscribe.component.html',
  styleUrls: ['./unsubscribe.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PaModalModule, PaDateTimeModule, PaButtonModule, CurrencyPipe, TranslatePipe],
})
export class UnsubscribeComponent {
  data = this.modal.config.data;

  constructor(public modal: ModalRef<UnsubscribeModalData>) {}

  confirm() {
    this.modal.close(true);
  }
}
