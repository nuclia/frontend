import { SlicePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ModalRef, PaButtonModule, PaModalModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule, TranslatePipe } from '@ngx-translate/core';

@Component({
  templateUrl: './token-dialog.component.html',
  styleUrls: ['./token-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [PaModalModule, PaButtonModule, SlicePipe, TranslatePipe, TranslateModule],
})
export class TokenDialogComponent {
  clipboardSupported = !!navigator.clipboard?.writeText;
  successMessage = false;

  constructor(public modal: ModalRef) {}

  copy() {
    navigator.clipboard.writeText(this.modal.config.data?.['token']);
    this.successMessage = true;
    setTimeout(() => (this.successMessage = false), 2000);
  }

  close(): void {
    this.modal.close();
  }
}
