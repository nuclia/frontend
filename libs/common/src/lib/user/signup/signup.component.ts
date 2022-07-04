import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { ReCaptchaV3Service } from 'ngx-captcha';
import { STFConfirmComponent } from '@flaps/components';
import { STFInputComponent } from '@flaps/pastanaga';
import { LoginService, SignupData, BackendConfigurationService } from '@flaps/core';

@Component({
  selector: 'stf-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss'],
})
export class SignupComponent implements OnInit, OnDestroy {
  // TODO: convert checkboxes into standard form fields
  acceptedConditions: boolean = false;
  acceptedPrivacy: boolean = false;

  signupForm = this.formBuilder.group({
    username: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
  });

  validationMessages = {
    username: {
      required: 'validation.required',
    },
    email: {
      required: 'validation.required',
      email: 'validation.email',
    },
  };

  emailAlreadyExists: boolean = false;
  unsubscribeAll = new Subject<void>();
  @ViewChild('email', { static: false }) email: STFInputComponent | undefined;

  constructor(
    private loginService: LoginService,
    private formBuilder: UntypedFormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private reCaptchaV3Service: ReCaptchaV3Service,
    private config: BackendConfigurationService,
    private dialog: MatDialog,
  ) {
    const emailControl = this.signupForm.controls['email'];
    emailControl.valueChanges.pipe(takeUntil(this.unsubscribeAll)).subscribe(() => {
      if (this.emailAlreadyExists) {
        this.emailAlreadyExists = false;
      }
    });
  }

  ngOnInit(): void {
    const token = this.route.snapshot.queryParams.token;
    if (token) {
      // Token is set when coming from confirmation email link
      this.router.navigate(['../magic'], {
        relativeTo: this.route,
        queryParamsHandling: 'merge', // Preserve token
      });
    }
  }

  onEnterPressed(formField: string) {
    if (formField === 'username') {
      this.email!.element?.nativeElement.focus();
    } else {
      this.submit();
    }
  }

  submit() {
    if (!this.signupForm.valid) return;
    if (!this.acceptedConditions || !this.acceptedPrivacy) return;

    this.reCaptchaV3Service.execute(this.config.getRecaptchaKey(), 'login', (token) => {
      this.signup(token);
    });
  }

  signup(token: string) {
    const signupData: SignupData = {
      name: this.signupForm.value.username,
      email: this.signupForm.value.email,
    };
    this.loginService.signup(signupData, token).subscribe((response) => {
      if (response.action === 'check-mail') {
        this.showConfirmation();
      } else if (response.action === 'user-exists') {
        this.emailAlreadyExists = true;
      }
    });
  }

  showConfirmation() {
    const dialogRef = this.dialog.open(STFConfirmComponent, {
      width: '420px',
      data: {
        title: 'login.check_email',
        messages: ['login.email_sent', 'login.validate_and_explore'],
        confirmText: 'Ok',
        onlyConfirm: true,
        minWidthButtons: '110px',
      },
    });
    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe((result) => {
        if (result) {
          this.router.navigate(['../login'], {
            relativeTo: this.route,
            queryParamsHandling: 'merge', // Preserve login_challenge
          });
        }
      });
  }

  ngOnDestroy() {
    if (this.unsubscribeAll) {
      this.unsubscribeAll.next();
      this.unsubscribeAll.complete();
    }
  }
}
