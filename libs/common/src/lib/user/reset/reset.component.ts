import { Component, Inject, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { FormBuilder, Validators, NgForm } from '@angular/forms';
import { ReCaptchaV3Service } from 'ngx-captcha';
import { Router, ActivatedRoute } from '@angular/router';
import { STFInputComponent } from '@flaps/pastanaga';
import { LoginService, BackendConfigurationService, ResetData } from '@flaps/auth';
import { MIN_PASSWORD_LENGTH } from '@flaps/core';
import { SamePassword } from '../../validators/form.validator';

@Component({
  selector: 'stf-reset',
  templateUrl: './reset.component.html',
  styleUrls: ['./reset.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResetComponent {
  @ViewChild('form') form?: NgForm;
  @ViewChild('passwordConfirm') passwordConfirm?: STFInputComponent;

  magicToken: string | undefined;
  oauth: boolean = this.config.getOAuthLogin();
  passwordRecovered: boolean = false;

  resetForm = this.formBuilder.group({
    password: ['', [Validators.required, Validators.minLength(MIN_PASSWORD_LENGTH)]],
    passwordConfirm: ['', [Validators.required, SamePassword('password')]],
  });

  resetValidationMessages = {
    password: {
      required: 'validation.required',
      minlength: 'validation.password_minlength',
    },
    passwordConfirm: {
      required: 'validation.required',
      passwordMismatch: 'validation.password_mismatch',
    }
  };

  constructor(
    private formBuilder: FormBuilder,
    private loginService: LoginService,
    private router: Router,
    private route: ActivatedRoute,
    private reCaptchaV3Service: ReCaptchaV3Service,
    private config: BackendConfigurationService,
    private cdr: ChangeDetectorRef,
    @Inject(DOCUMENT) private document: Document,
  ) {
    this.route.queryParams.subscribe((params) => {
      this.magicToken = params.token;
    });
  }

  onEnterPressed(formField: string) {
    if (formField === 'passwordConfirm') {
      (this.document.activeElement as HTMLElement).blur(); // Update password confirm before submit
      this.form?.onSubmit({} as Event);
    }
    else {
      this.passwordConfirm?.element?.nativeElement.focus();
    }
  }

  submit() {
    if (!this.resetForm.valid) return;
    this.reCaptchaV3Service.execute(this.config.getRecaptchaKey(), 'reset', (token) => {
      this.reset(token);
    });
  }

  reset(token: string) {
    if (this.magicToken) {
      const resetInfo = new ResetData(this.resetForm.value.password, this.magicToken);
      this.loginService.reset(resetInfo, token).subscribe(() => {
        if (this.oauth) {
          this.passwordRecovered = true;
          this.cdr.markForCheck();
        }
        else {
          this.goLogin();
        }
      });
    }
  }

  goLogin() {
    this.router.navigate(['../login'], {
      relativeTo: this.route
    });
  }
}