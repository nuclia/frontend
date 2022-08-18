import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { forkJoin, map, Subject } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { ReCaptchaV3Service } from 'ngx-captcha';
import { BackendConfigurationService, LoginService, SignupData } from '@flaps/core';
import { SisModalService } from '@nuclia/sistema';
import { TranslateService } from '@ngx-translate/core';
import { InputComponent } from '@guillotinaweb/pastanaga-angular';

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
  @ViewChild('email', { static: false }) email: InputComponent | undefined;

  constructor(
    private loginService: LoginService,
    private formBuilder: UntypedFormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private reCaptchaV3Service: ReCaptchaV3Service,
    private config: BackendConfigurationService,
    private modalService: SisModalService,
    private translate: TranslateService,
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
      this.email!.hasFocus = true;
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
    forkJoin([this.translate.get('login.email_sent'), this.translate.get('login.validate_and_explore')])
      .pipe(
        map((messages) => messages.join('<br>')),
        switchMap(
          (description) =>
            this.modalService.openConfirm({
              title: 'login.check_email',
              description,
              confirmLabel: 'Ok',
              onlyConfirm: true,
            }).onClose,
        ),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe(() => {
        this.router.navigate(['../login'], {
          relativeTo: this.route,
          queryParamsHandling: 'merge', // Preserve login_challenge
        });
      });
  }

  ngOnDestroy() {
    if (this.unsubscribeAll) {
      this.unsubscribeAll.next();
      this.unsubscribeAll.complete();
    }
  }
}
