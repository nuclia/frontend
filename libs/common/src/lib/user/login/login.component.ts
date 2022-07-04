import { Component, OnInit, ViewChild, Inject, ElementRef } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { DOCUMENT } from '@angular/common';
import { ReCaptchaV3Service } from 'ngx-captcha';

import { OAuthService, SAMLService, BackendConfigurationService, GoogleService } from '@flaps/core';
import { OAuthErrors, SDKService } from '@flaps/core';
import { STFPasswordInputComponent, STFInputComponent } from '@flaps/pastanaga';

@Component({
  selector: 'stf-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  @ViewChild('email', { static: false }) email: STFInputComponent | undefined;
  @ViewChild('password', { static: false }) password: STFPasswordInputComponent | undefined;
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

  ngOnInit() {}

  onEnterPressed(formField: string) {
    if (formField === 'password') {
      this.email?.element?.nativeElement.focus(); // Validate password field before login
      this.login();
    } else {
      this.password?.focus();
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

  checkSAML(email: string) {
    if (this.config.getSAMLLogin()) {
      const parts = email.split('@');
      const domain = parts.length > 1 ? parts.pop() : null;
      if (domain && domain.length > 0) {
        this.samlService.checkDomain(domain).subscribe(
          (result) => {
            const challenge = this.oauth ? this.loginChallenge : undefined;
            this.document.location.href = this.samlService.ssoUrl(result.account_id, challenge);
          },
          () => {
            // Continue
          },
        );
      }
    }
  }

  recoverPassword(event: any) {
    event.preventDefault();
    this.router.navigate(['../recover'], {
      relativeTo: this.route,
      queryParamsHandling: 'preserve', // Preserve login_challenge
    });
  }
}
