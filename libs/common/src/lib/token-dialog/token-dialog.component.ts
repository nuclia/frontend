import { Component } from '@angular/core';
import { ModalRef } from '@guillotinaweb/pastanaga-angular';
import { data } from '../../../../pastanaga-angular/projects/demo/src';

@Component({
  templateUrl: './token-dialog.component.html',
  styleUrls: ['./token-dialog.component.scss'],
})
export class TokenDialogComponent {
  clipboardSupported: boolean = !!(navigator.clipboard && navigator.clipboard.writeText);
  successMessage = false;

  constructor(public modal: ModalRef) {}

  copy() {
    navigator.clipboard.writeText(this.modal.config.data?.token);
    this.successMessage = true;
    setTimeout(() => (this.successMessage = false), 2000);
  }

  close(): void {
    this.modal.close();
  }

  protected readonly data = data;
}
