import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, distinctUntilChanged, map, of, switchMap } from 'rxjs';

import { BackendConfigurationService, OAuthLoginData, OAuthService, SAMLService } from '@flaps/core';
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

  loginChallenge: string | undefined;
  loginData: OAuthLoginData | undefined;

  message: string | null = null;
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
  signUpUrl = '';

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
    private samlService: SAMLService,
  ) {
    if (this.config.useRemoteLogin()) {
      this.remoteLogin();
    }
    const loginData: OAuthLoginData | null = this.route.snapshot.data['loginData'];
    this.signUpUrl = `${loginData?.came_from || this.oAuthService.getCameFrom()}/user/signup`;
    this.route.data.subscribe((data) => {
      if (data['loginData']['needs_initial_setpassword']) {
        this.router.navigate(['/user/recover'], {
          queryParamsHandling: 'merge',
          queryParams: { isPasswordInit: true },
        });
      }
    });
    this.route.queryParams.subscribe((params) => {
      this.message = params['message'];
      this.loginChallenge = params['login_challenge'];

      // Get data from resolver - resolver handles skip_login auto-submit before component loads
      this.loginData = this.route.snapshot.data['loginData'];

      if (!this.loginChallenge) {
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
      this.reCaptchaV3Service.execute('login').subscribe(() => {
        this.oAuthLogin();
      });
    } else {
      this.oAuthLogin();
    }
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
