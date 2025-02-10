import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ModalRef, PaButtonModule, PaDatePickerModule, PaModalModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  imports: [CommonModule, PaDatePickerModule, PaModalModule, TranslateModule, PaButtonModule],
  templateUrl: './expiration-modal.component.html',
  styleUrl: './expiration-modal.component.scss',
})
export class ExpirationModalComponent {
  expiration = new Date();

  constructor(public modal: ModalRef<void, { expiration: Date }>) {
    this.expiration.setFullYear(this.expiration.getFullYear() + 1);
  }

  add() {
    this.modal.close({ expiration: this.expiration });
  }

  close() {
    this.modal.close();
  }
}
