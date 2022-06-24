import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Location } from '@angular/common';
import { UntypedFormBuilder, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { Subject, Observable, of, forkJoin, takeUntil, switchMap, filter } from 'rxjs';
import { SDKService, SetUserPreferences, UserService, LoginService } from '@flaps/auth';
import { STFUtils, MIN_PASSWORD_LENGTH, DEFAULT_LANG } from '@flaps/core';
import { WelcomeUser, Language } from '@nuclia/core';
import { SamePassword } from '../../validators/form.validator';

@Component({
  selector: 'stf-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent implements OnInit {
  userPrefs: WelcomeUser | undefined;
  language: string[] = [];
  languages = STFUtils.supportedLanguages().map((lang) => (
    { label: 'language.' + lang, value: lang}
  ));

  canModifyPassword: boolean = false; // TODO
  canModifyEmail: boolean = false; // TODO

  profileForm = this.formBuilder.group({
    name: ['', [Validators.required]],
    email: [{value: '', disabled: !this.canModifyEmail}, [Validators.required, Validators.email]],
    password: ['', this.optionalPassword('passwordConfirm', [Validators.minLength(MIN_PASSWORD_LENGTH)])],
    passwordConfirm: ['', this.optionalPassword('password',[SamePassword('password')])],
  });

  profile_validation_messages = {
    name: {
      required: 'validation.name_required',
    },
    email: {
      required: 'validation.required',
      email: 'validation.email',
    },
    password: {
      required: 'validation.password_required',
      minlength: 'validation.password_minlength',
    },
    passwordConfirm: {
      passwordMismatch: 'validation.password_mismatch',
    },
  };

  private unsubscribeAll = new Subject<void>();

  constructor(
    private userService: UserService,
    private formBuilder: UntypedFormBuilder,
    private translate: TranslateService,
    private location: Location,
    private loginService: LoginService,
    private sdk: SDKService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.userService.userPrefs
      .pipe(filter((prefs) => !!prefs), takeUntil(this.unsubscribeAll))
      .subscribe(prefs => {
        this.userPrefs = prefs;
        this.language = [(prefs!.language || DEFAULT_LANG).toLowerCase()];
        this.profileForm.get('name')?.setValue(prefs?.name);
        this.profileForm.get('email')?.setValue(prefs?.email);
        this.cdr?.markForCheck();
      });
  }

  save() {
    if (this.profileForm.valid) {
      const payload: SetUserPreferences = {
        name: this.profileForm.value.name,
        email: this.profileForm.value.email,
      };

      if (this.language[0]) {
        payload.language = this.language[0].toUpperCase() as Language;
      }

      let setPassword: Observable<boolean | null> = of(null);
      if (this.profileForm.value.password && this.profileForm.value.passwordConfirm) {
        setPassword = this.sdk.nuclia.auth.setPassword(this.profileForm.value.password);
      }
      forkJoin([this.loginService.setPreferences(payload), setPassword])
        .pipe(switchMap(() => this.userService.updateWelcome()))
        .subscribe(() => {
          if (this.language[0]) {
            this.translate.use(this.language[0]);
          }
          this.goBack();
        });
    }
  }

  goBack() {
    this.location.back();
  }

  optionalPassword(siblingPassword: string, validators: ValidatorFn[]): ValidatorFn {
    return (control: AbstractControl) => {
      const siblingField = control.parent?.get(siblingPassword);
      const composedValidators = Validators.compose(validators);
      if (composedValidators) {
        return control.value || siblingField?.value ? composedValidators(control) : null;
      }
      return null;
    };
  }
}