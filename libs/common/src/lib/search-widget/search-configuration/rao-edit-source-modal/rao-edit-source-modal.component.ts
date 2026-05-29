import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalRef, PaButtonModule, PaModalModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';

export interface EditSourceModalData {
  sourceLabel: string;
  description: string;
}

export interface EditSourceModalResult {
  label: string;
  description: string;
}

@Component({
  selector: 'stf-rao-edit-source-modal',
  imports: [FormsModule, PaButtonModule, PaModalModule, PaTextFieldModule, TranslateModule],
  templateUrl: './rao-edit-source-modal.component.html',
  styleUrl: './rao-edit-source-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RaoEditSourceModalComponent {
  label = '';
  description = '';

  constructor(public modal: ModalRef<EditSourceModalData, EditSourceModalResult>) {
    this.label = modal.config.data?.sourceLabel ?? '';
    this.description = modal.config.data?.description ?? '';
  }

  save() {
    this.modal.close({ label: this.label, description: this.description });
  }
}
