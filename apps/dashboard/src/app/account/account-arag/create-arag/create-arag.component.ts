import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalRef, PaButtonModule, PaModalModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  imports: [CommonModule, PaModalModule, PaButtonModule, PaTextFieldModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './create-arag.component.html',
  styleUrl: './create-arag.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateAragComponent {
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
