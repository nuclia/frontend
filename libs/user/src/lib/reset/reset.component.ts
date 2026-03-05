import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LoginService, ResetData, ResetResponse } from '@flaps/core';
import { IErrorMessages } from '@guillotinaweb/pastanaga-angular';
import { SisToastService } from '@nuclia/sistema';
import { ReCaptchaV3Service } from 'ng-recaptcha-2';
import { StrongPassword, SamePassword } from '../password.validator';
import { tap } from 'rxjs';

@Component({
  selector: 'nus-reset',
  templateUrl: './reset.component.html',
  styleUrls: ['./reset.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ResetComponent {
  magicToken: string | undefined;
  resetForm = new FormGroup({
    username: new FormControl('', {
      nonNullable: true,
    }),
    password: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, StrongPassword],
    }),
    passwordConfirm: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, SamePassword('password')],
    }),
  });

  resetValidationMessages = {
    password: {
      required: 'validation.required',
      minlength: 'validation.password_minlength',
    },
    passwordConfirm: {
      required: 'validation.required',
      passwordMismatch: 'validation.password_mismatch',
    } as IErrorMessages,
  };

  pending = false;
  initFullname = false;

  constructor(
    private loginService: LoginService,
    private router: Router,
    private route: ActivatedRoute,
    private reCaptchaV3Service: ReCaptchaV3Service,
    private toaster: SisToastService,
    private cdr: ChangeDetectorRef,
  ) {
    this.route.queryParams.subscribe((params) => {
      this.magicToken = params['token'];
    });
    this.route.url.subscribe((u) => (this.initFullname = u[0].path === 'setup'));
  }

  submit() {
    if (!this.resetForm.valid) return;
    this.pending = true;
    this.reCaptchaV3Service.execute('reset').subscribe({
      next: (token) => {
        this.apply(token);
      },
      error: (error) => {
        throw new Error('Recaptcha error', error);
      },
    });
  }

  apply(reCaptchaToken: string) {
    if (this.magicToken) {
      const password = this.resetForm.getRawValue().password;
      const fullname = this.resetForm.getRawValue().username;
      const token = this.magicToken;
      const request = this.initFullname
        ? this.loginService.setup({ fullname, password, token }, reCaptchaToken)
        : this.loginService.reset({ password, token }, reCaptchaToken);
      request.subscribe({
        next: (data) => {
          this.toaster.success('reset.password_reset');
          this.pending = false;
          this.goLogin(data.login_challenge);
        },
        error: (error) => {
          this.toaster.error(error.status === 500 ? 'reset.invalid-token' : 'generic.error.oops');
          this.pending = false;
          this.cdr.markForCheck();
        },
      });
    }
  }

  goLogin(login_challenge: string) {
    this.router.navigate(['../login'], {
      relativeTo: this.route,
      queryParams: { login_challenge },
    });
  }
}
