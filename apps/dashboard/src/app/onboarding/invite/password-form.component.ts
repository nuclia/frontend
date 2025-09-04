import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { IErrorMessages, PaButtonModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MIN_PASSWORD_LENGTH } from '@flaps/core';
import { SamePassword } from '@nuclia/user';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-password-form',
  imports: [CommonModule, PaButtonModule, PaTextFieldModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './password-form.component.html',
  styleUrls: ['./password-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasswordFormComponent implements OnInit {
  @Input() showUsername = true;
  @Input() submitText = 'generic.save';
  @Output() submitData = new EventEmitter<{ username?: string; password: string }>();

  passwordForm = new FormGroup({
    username: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(MIN_PASSWORD_LENGTH)],
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

  ngOnInit(): void {
    if (!this.showUsername) {
      this.passwordForm.controls.username.clearValidators();
      this.passwordForm.controls.username.updateValueAndValidity();
    }
  }

  submit() {
    if (!this.passwordForm.valid) return;
    this.submitData.emit(this.passwordForm.getRawValue());
  }
}
