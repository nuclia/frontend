import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { filter, Subject, switchMap, takeUntil } from 'rxjs';
import { DEFAULT_LANG, LoginService, SetUserPreferences, STFUtils, UserService } from '@flaps/core';
import { Language, WelcomeUser } from '@nuclia/core';

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

  profileForm = this.formBuilder.group({
    name: ['', [Validators.required]],
    email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
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

      this.loginService
        .setPreferences(payload)
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
}
