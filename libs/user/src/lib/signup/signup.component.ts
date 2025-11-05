import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AnalyticsService, BackendConfigurationService, FeaturesService, LoginService } from '@flaps/core';
import { IErrorMessages } from '@guillotinaweb/pastanaga-angular';
import { ReCaptchaV3Service } from 'ng-recaptcha-2';
import { Subject } from 'rxjs';

@Component({
  selector: 'nus-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class SignupComponent implements OnInit {
  config = inject(BackendConfigurationService);
  signupForm = new FormGroup({
    name: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl<string>('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
  });

  validationMessages = {
    name: {
      required: 'validation.required',
    },
    password: {
      required: 'validation.required',
    },
    email: {
      required: 'validation.required',
      email: 'validation.email',
      conflict: 'signup.email.already_exists',
      personalEmail: 'login.error.no_personal_email',
    } as IErrorMessages,
  };

  unsubscribeAll = new Subject<void>();

  error?: string;

  get emailControl() {
    return this.signupForm.controls['email'];
  }
  isGitHubEnabled = this.features.unstable.githubSignin;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private reCaptchaV3Service: ReCaptchaV3Service,
    private loginService: LoginService,
    private cdr: ChangeDetectorRef,
    private features: FeaturesService,
    private analytics: AnalyticsService,
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
    this.loginService.signup(formValue, token).subscribe({
      next: (response) => {
        this.analytics.logTrialSignup();
        if (response.action === 'check-mail') {
          this.router.navigate(['../check-mail'], {
            relativeTo: this.route,
            queryParams: { email: formValue.email },
            queryParamsHandling: 'merge', // Preserve login_challenge
          });
        } else if (response.action === 'user-exists') {
          this.emailControl.setErrors({ conflict: true });
        }
      },
      error: (error) => {
        if (error.status === 412) {
          this.emailControl.setErrors({ personalEmail: true });
        } else {
          this.error = 'login.error.oops';
        }
        this.cdr.markForCheck();
      },
    });
  }
}
