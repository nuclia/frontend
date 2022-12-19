import { Component, ElementRef, Inject, ViewChild } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DOCUMENT } from '@angular/common';
import { ReCaptchaV3Service } from 'ngx-captcha';

import {
  BackendConfigurationService,
  GoogleService,
  OAuthErrors,
  OAuthService,
  SAMLService,
  SDKService,
} from '@flaps/core';
import { InputComponent } from '@guillotinaweb/pastanaga-angular';
import { PasswordInputComponent } from '@nuclia/sistema';

@Component({
  selector: 'stf-login',
  templateUrl: './old-login.component.html',
  styleUrls: ['./old-login.component.scss'],
})
export class OldLoginComponent {
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

  loginForm = this.formBuilder.group({
    email: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  constructor(
    private formBuilder: UntypedFormBuilder,
    private samlService: SAMLService,
    private oAuthService: OAuthService,
    private googleService: GoogleService,
    private router: Router,
    @Inject(DOCUMENT) private document: Document,
    private route: ActivatedRoute,
    private reCaptchaV3Service: ReCaptchaV3Service,
    public config: BackendConfigurationService,
    private sdk: SDKService,
  ) {
    this.route.queryParams.subscribe((params) => {
      this.message = params.message;
      this.loginChallenge = params.login_challenge;
      this.oauth = this.config.getOAuthLogin();
      if (this.oauth && !this.loginChallenge) {
        this.error = 'login.error.unknown_login_challenge';
      }
      if (params.error) {
        const error = params.error as OAuthErrors;
        this.message = 'login.error.' + error;
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
    if (this.config.getRecaptchaKey() !== undefined) {
      this.reCaptchaV3Service.execute(this.config.getRecaptchaKey(), 'login', (token) => {
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
    this.sdk.nuclia.auth.login(this.loginForm.value.email, this.loginForm.value.password, recaptchaToken).subscribe({
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

  googleLogin(): void {
    this.document.location.href = this.googleService.getGoogleLoginUrl();
  }

  recoverPassword(event: any) {
    event.preventDefault();
    this.router.navigate(['../recover'], {
      relativeTo: this.route,
      queryParamsHandling: 'preserve', // Preserve login_challenge
    });
  }
}
