import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
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
  title?: string;
  value?: string;
  help?: string;
  placeholder?: string;

  constructor(public modal: ModalRef<{ title: string; value: string; help?: string; placeholder?: string }, string>) {
    if (this.modal.config.data) {
      this.title = this.modal.config.data.title;
      this.value = this.modal.config.data.value;
      this.help = this.modal.config.data.help;
      this.placeholder = this.modal.config.data.placeholder;
    }
  }

  edit() {
    this.modal.close(this.value);
  }
}
