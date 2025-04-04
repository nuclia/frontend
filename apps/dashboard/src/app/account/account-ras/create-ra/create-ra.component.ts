import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalRef, PaButtonModule, PaModalModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  imports: [CommonModule, PaModalModule, PaButtonModule, PaTextFieldModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './create-ra.component.html',
  styleUrl: './create-ra.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateRaComponent {
  form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  constructor(public modal: ModalRef) {}

  create() {
    if (this.form.valid) {
      this.modal.close(this.form.getRawValue());
    }
  }
}
