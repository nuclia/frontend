import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ReCaptchaV3Service } from 'ngx-captcha';
import { BackendConfigurationService, FeaturesService, LoginService } from '@flaps/core';
import { Subject } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { IErrorMessages } from '@guillotinaweb/pastanaga-angular';

@Component({
  selector: 'stf-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignupComponent implements OnInit {
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
  isGitHubEnabled = this.features.githubSignin;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private reCaptchaV3Service: ReCaptchaV3Service,
    private loginService: LoginService,
    public config: BackendConfigurationService,
    private cdr: ChangeDetectorRef,
    private features: FeaturesService,
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

    const recaptchaKey = this.config.getRecaptchaKey();
    if (recaptchaKey) {
      this.reCaptchaV3Service.execute(recaptchaKey, 'login', (token) => {
        this.signupFromForm(token);
      });
    } else {
      throw new Error('Recaptcha key not found');
    }
  }

  private signupFromForm(token: string) {
    const formValue = this.signupForm.getRawValue();
    this.loginService.signup(formValue, token).subscribe({
      next: (response) => {
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
