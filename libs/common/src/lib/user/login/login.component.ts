import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ReCaptchaV3Service } from 'ngx-captcha';

import { BackendConfigurationService, OAuthService, SDKService } from '@flaps/core';
import { InputComponent } from '@guillotinaweb/pastanaga-angular';
import { PasswordInputComponent } from '@nuclia/sistema';

@Component({
  selector: 'stf-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  @ViewChild('email', { static: false }) email: InputComponent | undefined;
  @ViewChild('password', { static: false }) password: PasswordInputComponent | undefined;
  @ViewChild('form', { static: false }) form: ElementRef | undefined;

  oauth: boolean = false;
  loginChallenge: string | undefined;

  message: string | null = null;
  formError: boolean = false;
  error: string | null = null;

  loginValidationMessages = {
    email: {
      required: 'validation.required',
    },
    password: {
      required: 'validation.required',
    },
  };

  loginForm = new FormGroup({
    email: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    password: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
  });

  constructor(
    private oAuthService: OAuthService,
    private router: Router,
    private route: ActivatedRoute,
    private reCaptchaV3Service: ReCaptchaV3Service,
    public config: BackendConfigurationService,
    private sdk: SDKService,
  ) {
    if (this.config.useRemoteLogin()) {
      this.remoteLogin();
    }
    this.route.queryParams.subscribe((params) => {
      this.message = params['message'];
      this.loginChallenge = params['login_challenge'];
      this.oauth = this.config.getOAuthLogin();
      if (this.oauth && !this.loginChallenge) {
        this.error = 'login.error.unknown_login_challenge';
      }
      if (params['error']) {
        this.message = params['error_description'] || 'login.error.' + params['error'];
      }
    });
  }

  onEnterPressed(formField: string) {
    if (formField === 'email') {
      this.password!.hasFocus = true;
    }
  }

  login() {
    if (!this.loginForm.valid) return;
    const recaptchaKey = this.config.getRecaptchaKey();
    if (recaptchaKey) {
      this.reCaptchaV3Service.execute(recaptchaKey, 'login', (token) => {
        this.doLogin(token);
      });
    } else {
      this.doLogin();
    }
  }

  private doLogin(recaptchaToken: string = '') {
    if (this.oauth) {
      this.oAuthLogin();
    } else {
      this.firstPartyLogin(recaptchaToken);
    }
  }

  firstPartyLogin(recaptchaToken: string) {
    const formValue = this.loginForm.getRawValue();
    this.sdk.nuclia.auth.login(formValue.email, formValue.password, recaptchaToken).subscribe({
      next: () => this.router.navigate(['/']),
      error: () => (this.formError = true),
    });
  }

  oAuthLoginUrl() {
    return this.oAuthService.loginUrl();
  }

  oAuthLogin() {
    if (this.loginForm.valid) {
      this.form?.nativeElement.submit();
    }
  }

  private remoteLogin() {
    location.href = `${this.config.getAPIOrigin()}/redirect?redirect=http://localhost:4200`;
  }
}
