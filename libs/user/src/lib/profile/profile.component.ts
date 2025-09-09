import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { AbstractControl, UntypedFormBuilder, ValidatorFn, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { filter, forkJoin, Observable, of, Subject, switchMap, takeUntil } from 'rxjs';
import {
  DEFAULT_LANG,
  LoginService,
  MIN_PASSWORD_LENGTH,
  SDKService,
  SetUserPreferences,
  STFUtils,
  UserService,
} from '@flaps/core';
import { Language, WelcomeUser } from '@nuclia/core';
import { IErrorMessages } from '@guillotinaweb/pastanaga-angular';
import { SamePassword } from '../password.validator';

@Component({
  selector: 'nus-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ProfileComponent implements OnInit {
  userPrefs: WelcomeUser | undefined;
  languages = STFUtils.supportedLanguages().map((lang) => ({ label: 'language.' + lang, value: lang }));

  canModifyPassword = false; // TODO
  canModifyEmail = false; // TODO

  profileForm = this.formBuilder.group({
    name: ['', [Validators.required]],
    email: [{ value: '', disabled: !this.canModifyEmail }, [Validators.required, Validators.email]],
    password: ['', this.optionalPassword('passwordConfirm', [Validators.minLength(MIN_PASSWORD_LENGTH)])],
    passwordConfirm: ['', this.optionalPassword('password', [SamePassword('password')])],
    language: [''],
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
    } as IErrorMessages,
  };

  get language() {
    return this.profileForm.get('language')?.value || '';
  }

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
      .pipe(
        filter((prefs) => !!prefs),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe((prefs) => {
        this.userPrefs = prefs;
        this.profileForm.get('language')?.setValue((prefs?.language || DEFAULT_LANG).toLowerCase());
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

      if (this.language) {
        payload.language = this.language.toUpperCase() as Language;
      }

      let setPassword: Observable<boolean | null> = of(null);
      if (this.profileForm.value.password && this.profileForm.value.passwordConfirm) {
        setPassword = this.sdk.nuclia.auth.setPassword(this.profileForm.value.password);
      }
      forkJoin([this.loginService.setPreferences(payload), setPassword])
        .pipe(switchMap(() => this.userService.updateWelcome()))
        .subscribe(() => {
          if (this.language) {
            this.translate.use(this.language);
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
