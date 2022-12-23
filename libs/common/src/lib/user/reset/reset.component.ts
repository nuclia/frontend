import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormControl, FormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { ReCaptchaV3Service } from 'ngx-captcha';
import { ActivatedRoute, Router } from '@angular/router';
import { BackendConfigurationService, LoginService, MIN_PASSWORD_LENGTH, ResetData } from '@flaps/core';
import { SamePassword } from '../../validators/form.validator';
import { IErrorMessages, ToastService } from '@guillotinaweb/pastanaga-angular';

@Component({
  selector: 'stf-reset',
  templateUrl: './reset.component.html',
  styleUrls: ['./reset.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetComponent {
  magicToken: string | undefined;
  oauth: boolean = this.config.getOAuthLogin();
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
    private formBuilder: UntypedFormBuilder,
    private loginService: LoginService,
    private router: Router,
    private route: ActivatedRoute,
    private reCaptchaV3Service: ReCaptchaV3Service,
    private config: BackendConfigurationService,
    private cdr: ChangeDetectorRef,
    private toaster: ToastService,
  ) {
    this.route.queryParams.subscribe((params) => {
      this.magicToken = params.token;
    });
  }

  submit() {
    if (!this.resetForm.valid) return;
    this.resetting = true;
    this.reCaptchaV3Service.execute(this.config.getRecaptchaKey(), 'reset', (token) => {
      this.reset(token);
    });
  }

  reset(token: string) {
    if (this.magicToken) {
      const resetInfo = new ResetData(this.resetForm.getRawValue().password, this.magicToken);
      this.loginService.reset(resetInfo, token).subscribe({
        complete: () => {
          this.toaster.openSuccess('reset.password_reset');
          this.resetting = false;
          if (!this.oauth) {
            this.goLogin();
          }
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
