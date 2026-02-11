import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { IErrorMessages, PaButtonModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { StrongPassword, SamePassword } from '../password.validator';
import { SisPasswordInputModule } from '@nuclia/sistema';

@Component({
  selector: 'app-password-form',
  imports: [PaButtonModule, PaTextFieldModule, ReactiveFormsModule, SisPasswordInputModule, TranslateModule],
  templateUrl: './password-form.component.html',
  styleUrls: ['./password-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasswordFormComponent {
  @Output() submitData = new EventEmitter<{ username?: string; password: string }>();

  passwordForm = new FormGroup({
    username: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, StrongPassword],
    }),
    passwordConfirm: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, SamePassword('password')],
    }),
  });

  validationMessages: { [key: string]: IErrorMessages } = {
    username: {
      required: 'validation.required',
    },
    password: {
      required: 'validation.required',
      minlength: 'validation.password_minlength',
    },
    passwordConfirm: {
      required: 'validation.required',
      passwordMismatch: 'validation.password_mismatch',
    } as IErrorMessages,
  };

  submit() {
    if (!this.passwordForm.valid) return;
    this.submitData.emit(this.passwordForm.getRawValue());
  }
}
