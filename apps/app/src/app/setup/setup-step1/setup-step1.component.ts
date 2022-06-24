import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { SamePassword } from '@flaps/common';
import { AuthService, SDKService } from '@flaps/auth';
import { SetupStep } from '../setup-header/setup-header.component';
import { MIN_PASSWORD_LENGTH } from '@flaps/core';

@Component({
  selector: 'app-setup-step1',
  templateUrl: './setup-step1.component.html',
  styleUrls: ['./setup-step1.component.scss'],
})
export class SetupStep1Component implements OnInit {
  step = SetupStep.Password;
  isSignup: boolean = false;

  validationMessages = {
    password: {
      required: 'validation.required',
      minlength: 'validation.password_minlength',
    },
    passwordConfirm: {
      required: 'validation.required',
      passwordMismatch: 'validation.password_mismatch',
    },
  };

  passwordForm = this.formBuilder.group({
    password: ['', [Validators.required, Validators.minLength(MIN_PASSWORD_LENGTH)]],
    passwordConfirm: ['', [Validators.required, SamePassword('password')]],
  });

  constructor(
    private formBuilder: UntypedFormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private sdk: SDKService,
  ) {}

  ngOnInit(): void {
    this.isSignup = this.route.snapshot.queryParams.signup === 'true';
  }

  submit() {
    if (!this.passwordForm.valid) return;
    const password = this.passwordForm.value.password;

    this.sdk.nuclia.auth.setPassword(password).subscribe((success) => {
      if (success) {
        this.router.navigate(['/setup/account'], {
          queryParamsHandling: 'merge', // Preserve 'signup' param
        });
      }
    });
  }
}
