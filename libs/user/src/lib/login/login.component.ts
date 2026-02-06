import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, distinctUntilChanged, map, of, switchMap } from 'rxjs';

import { BackendConfigurationService, OAuthLoginData, OAuthService, SAMLService, SDKService } from '@flaps/core';
import { InputComponent } from '@guillotinaweb/pastanaga-angular';
import { PasswordInputComponent } from '@nuclia/sistema';
import { ReCaptchaV3Service } from 'ng-recaptcha-2';

@Component({
  selector: 'nus-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: false,
})
export class LoginComponent {
  @ViewChild('email', { static: false }) email: InputComponent | undefined;
  @ViewChild('password', { static: false }) password: PasswordInputComponent | undefined;
  @ViewChild('form', { static: false }) form: ElementRef | undefined;

  oauth: boolean = false;
  loginChallenge: string | undefined;
  loginData: OAuthLoginData | undefined;

  message: string | null = null;
  loginError: boolean = false;
  formError: boolean = false;
  error: string | null = null;

  loginValidationMessages = {
    email: {
      required: 'validation.required',
      email: 'validation.email',
    },
    password: {
      required: 'validation.required',
    },
  };

  loginForm = new FormGroup({
    email: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
      updateOn: 'blur',
    }),
    password: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
  });
  get emailControl() {
    return this.loginForm.controls.email;
  }
  get passwordControl() {
    return this.loginForm.controls.password;
  }
  isLoggingIn = false;

  ssoUrl = this.loginForm.controls.email.valueChanges.pipe(
    distinctUntilChanged(),
    switchMap((email) => {
      const parts = (email || '').split('@');
      const domain = parts.length > 1 ? parts.pop() : undefined;
      return domain && domain.length > 0
        ? this.samlService.checkDomain(domain).pipe(catchError(() => of(undefined)))
        : of(undefined);
    }),
    map((result) => (result ? this.samlService.ssoUrl(result.account_id, this.loginChallenge) : undefined)),
  );

  constructor(
    private oAuthService: OAuthService,
    private router: Router,
    private route: ActivatedRoute,
    private reCaptchaV3Service: ReCaptchaV3Service,
    public config: BackendConfigurationService,
    private sdk: SDKService,
    private samlService: SAMLService,
  ) {
    if (this.config.useRemoteLogin()) {
      this.remoteLogin();
    }
    this.route.queryParams.subscribe((params) => {
      this.message = params['message'];
      this.loginChallenge = params['login_challenge'];
      this.oauth = !!this.loginChallenge; // Only set to true if loginChallenge is present

      // Get data from resolver - resolver handles skip_login auto-submit before component loads
      this.loginData = this.route.snapshot.data['loginData'];
      
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
    this.isLoggingIn = true;
    if (recaptchaKey) {
      this.reCaptchaV3Service.execute('login').subscribe((token) => {
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
      next: () => {
        this.router.navigate(['/']);
      },
      error: (error) => {
        this.loginError = true;
        this.formError = error.status === 401;
        this.isLoggingIn = false;
      },
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

  private autoSubmitOAuthForm() {
    // Submit OAuth form without validation (for skip_login scenario)
    this.form?.nativeElement.submit();
  }

  private remoteLogin() {
    location.href = `${this.config.getAPIOrigin()}/redirect?redirect=http://localhost:4200`;
  }
} 