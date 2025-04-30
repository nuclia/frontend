import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalRef, PaButtonModule, PaModalModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'nsi-textarea-modal-dialog',
  imports: [CommonModule, PaButtonModule, PaModalModule, PaTextFieldModule, TranslateModule],
  templateUrl: './textarea-modal.component.html',
  styleUrl: './textarea-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextareaModalComponent {
  title = this.modal.config.data?.title;
  value = this.modal.config?.data?.value;

  constructor(public modal: ModalRef<{ title: string; value: string }, string>) {}

  edit() {
    this.modal.close(this.value);
  }
}
