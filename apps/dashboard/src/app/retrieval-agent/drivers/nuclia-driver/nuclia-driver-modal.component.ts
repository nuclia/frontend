import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalRef, PaButtonModule, PaModalModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-nuclia-driver-modal',
  imports: [CommonModule, PaButtonModule, PaModalModule, PaTextFieldModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './nuclia-driver-modal.component.html',
  styleUrl: '../driver-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NucliaDriverModalComponent {
  form = new FormGroup({
    name: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
  });

  constructor(public modal: ModalRef) {}

  cancel() {
    this.modal.close();
  }

  submit() {
    if (this.form.valid) {
      console.log('TODO: submit form', this.form.getRawValue());
    }
  }
}
