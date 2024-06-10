import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalRef, PaButtonModule, PaModalModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'stf-save-config-modal',
  standalone: true,
  imports: [CommonModule, PaModalModule, TranslateModule, ReactiveFormsModule, PaTextFieldModule, PaButtonModule],
  templateUrl: './save-config-modal.component.html',
  styleUrl: './save-config-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaveConfigModalComponent {
  name = new FormControl<string>('', { validators: [Validators.required], nonNullable: true });

  constructor(public modal: ModalRef) {}

  submitName() {
    this.modal.close(this.name.getRawValue());
  }
}
