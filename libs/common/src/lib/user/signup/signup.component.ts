import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ReCaptchaV3Service } from 'ngx-captcha';
import { BackendConfigurationService, LoginService } from '@flaps/core';
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
    company: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl<string>('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
  });

  validationMessages = {
    name: {
      required: 'validation.required',
    },
    company: {
      required: 'validation.required',
    },
    password: {
      required: 'validation.required',
    },
    email: {
      required: 'validation.required',
      email: 'validation.email',
      conflict: 'login.email_already_exists',
    } as IErrorMessages,
  };

  unsubscribeAll = new Subject<void>();

  get emailControl() {
    return this.signupForm.controls['email'];
  }

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private reCaptchaV3Service: ReCaptchaV3Service,
    private loginService: LoginService,
    public config: BackendConfigurationService,
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParams.token;
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

    this.reCaptchaV3Service.execute(this.config.getRecaptchaKey(), 'login', (token) => {
      this.signupFromForm(token);
    });
  }

  private signupFromForm(token: string) {
    const formValue = this.signupForm.getRawValue();
    this.loginService.signup(formValue, token).subscribe((response) => {
      if (response.action === 'check-mail') {
        this.router.navigate(['../check-mail'], {
          relativeTo: this.route,
          queryParams: { email: formValue.email },
          queryParamsHandling: 'merge', // Preserve login_challenge
        });
      } else if (response.action === 'user-exists') {
        this.emailControl.setErrors({ conflict: true });
      }
    });
  }
}
