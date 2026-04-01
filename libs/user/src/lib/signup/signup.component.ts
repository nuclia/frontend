import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AnalyticsService,
  AuthService,
  BackendConfigurationService,
  FeaturesService,
  LoginService,
  OAuthService,
  SDKService,
  injectScript,
} from '@flaps/core';
import { ReCaptchaV3Service } from 'ng-recaptcha-2';
import { map, Subject, switchMap } from 'rxjs';
import { StrongPassword } from '../password.validator';

@Component({
  selector: 'nus-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class SignupComponent implements OnInit {
  config = inject(BackendConfigurationService);
  oauth = inject(OAuthService);
  authService = inject(AuthService);
  signup_token = '';
  signupForm = new FormGroup({
    password: new FormControl<string>('', { nonNullable: true, validators: [Validators.required, StrongPassword] }),
  });

  validationMessages = {
    required: 'validation.required',
  };

  unsubscribeAll = new Subject<void>();

  error?: string;

  isGitHubEnabled = this.features.unstable.githubSignin;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private reCaptchaV3Service: ReCaptchaV3Service,
    private loginService: LoginService,
    private cdr: ChangeDetectorRef,
    private features: FeaturesService,
    private analytics: AnalyticsService,
    private sdk: SDKService,
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParams['token'];
    if (token) {
      // Token is set by the backend (confirmation link and SSO)
      this.router.navigate(['../magic'], {
        relativeTo: this.route,
        queryParamsHandling: 'merge', // Preserve token
      });
    }
    injectScript('https://cdn.cookielaw.org/consent/f9397248-1dbe-47fc-9dbf-c50e7dd51096-test/otSDKStub.js', [
      {
        key: 'data-domain-script',
        value: 'f9397248-1dbe-47fc-9dbf-c50e7dd51096-test',
      },
    ]).subscribe();
  }

  submitForm() {
    if (!this.signupForm.valid) return;
    this.reCaptchaV3Service.execute('login').subscribe({
      next: (token) => {
        this.signupFromForm(token);
      },
      error: (error) => {
        throw new Error('ReCaptcha error', error);
      },
    });
  }

  private signupFromForm(token: string) {
    const formValue = this.signupForm.getRawValue();
    const loginChallenge = this.route.snapshot.queryParams['login_challenge'];
    const signupEmail = this.authService.getSignUpEmail();
    this.loginService.signup(formValue, token, loginChallenge).subscribe({
      next: (response) => {
        this.analytics.logTrialSignup();
        if (response.action === 'check-mail') {
          this.router.navigate(['../check-mail'], {
            relativeTo: this.route,
            queryParams: { email: signupEmail },
            queryParamsHandling: 'merge', // Preserve login_challenge
          });
        } else if (response.action === 'user-exists') {
          this.error = 'signup.email.already_exists';
        }
      },
      error: (error) => {
        if (error.status === 412) {
          this.error = 'login.error.no_personal_email';
        } else {
          this.error = 'login.error.oops';
        }
        this.cdr.markForCheck();
      },
    });
  }

  goToLogin() {
    this.sdk.nuclia.auth.redirectToOAuth();
  }
}
