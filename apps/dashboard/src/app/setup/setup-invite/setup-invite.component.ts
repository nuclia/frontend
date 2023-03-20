import { Component } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { concatMap } from 'rxjs';
import { SamePassword } from '@flaps/common';
import { LoginService, MIN_PASSWORD_LENGTH, SDKService } from '@flaps/core';
import { IErrorMessages } from '@guillotinaweb/pastanaga-angular';

@Component({
  selector: 'app-setup-invite',
  templateUrl: './setup-invite.component.html',
  styleUrls: ['./setup-invite.component.scss'],
})
export class SetupInviteComponent {
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

  passwordForm = this.formBuilder.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(MIN_PASSWORD_LENGTH)]],
    passwordConfirm: ['', [Validators.required, SamePassword('password')]],
  });

  constructor(
    private formBuilder: UntypedFormBuilder,
    private router: Router,
    private sdk: SDKService,
    private loginService: LoginService,
  ) {}

  submit() {
    if (!this.passwordForm.valid) return;
    const password = this.passwordForm.value.password;
    const name = this.passwordForm.value.username;

    this.loginService
      .setPreferences({ name })
      .pipe(concatMap(() => this.sdk.nuclia.auth.setPassword(password)))
      .subscribe((success) => {
        if (success) {
          this.router.navigate(['/select']);
        }
      });
  }
}
