import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ReCaptchaV3Service } from 'ngx-captcha';
import { ActivatedRoute, Router } from '@angular/router';
import { BackendConfigurationService, LoginService, MIN_PASSWORD_LENGTH, ResetData } from '@flaps/core';
import { IErrorMessages } from '@guillotinaweb/pastanaga-angular';
import { SisToastService } from '@nuclia/sistema';
import { SamePassword } from '../password.validator';

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
    password: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(MIN_PASSWORD_LENGTH)],
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

  resetting = false;

  constructor(
    private loginService: LoginService,
    private router: Router,
    private route: ActivatedRoute,
    private reCaptchaV3Service: ReCaptchaV3Service,
    private config: BackendConfigurationService,
    private cdr: ChangeDetectorRef,
    private toaster: SisToastService,
  ) {
    this.route.queryParams.subscribe((params) => {
      this.magicToken = params['token'];
    });
  }

  submit() {
    if (!this.resetForm.valid) return;
    this.resetting = true;
    const recaptchaKey = this.config.getRecaptchaKey();
    if (recaptchaKey) {
      this.reCaptchaV3Service.execute(recaptchaKey, 'reset', (token) => {
        this.reset(token);
      });
    } else {
      throw new Error('Recaptcha key not found');
    }
  }

  reset(token: string) {
    if (this.magicToken) {
      const resetInfo = new ResetData(this.resetForm.getRawValue().password, this.magicToken);
      this.loginService.reset(resetInfo, token).subscribe({
        complete: () => {
          this.toaster.success('reset.password_reset');
          this.resetting = false;
          this.goLogin();
         },
        error: () => {
          this.resetting = false;
        },
      });
    }
  }

  goLogin() {
    this.router.navigate(['../login'], {
      relativeTo: this.route,
    });
  }
}
