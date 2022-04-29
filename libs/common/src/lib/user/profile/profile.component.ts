import { APIService, UserPreferences } from '@flaps/auth';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Location } from '@angular/common';
import { FormBuilder, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SamePassword } from '../../validators/form.validator';
import { SDKService } from '@flaps/auth';

const UPDATE_PREFS = '@me';
const MIN_PASSWORD_LENGTH = 8;

@Component({
  selector: 'stf-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  profile_validation_messages = {
    name: {
      required: 'Name is required',
    },
    email: {
      required: 'Email is required',
      email: 'Incorrect email format',
    },
    language: {
      required: 'Language is required',
      pattern: 'Invalid language',
    },
  };

  password_validation_messages = {
    password: {
      required: 'validation.password_required',
      minlength: 'validation.password_minlength',
    },
    passwordConfirm: {
      passwordMismatch: 'validation.password_mismatch',
    },
  };

  profileForm = this.formBuilder.group({
    name: ['', [Validators.required]],
    language: ['', [Validators.required, Validators.pattern('ca|es|en')]],
    email: ['', [Validators.required, Validators.email]],
    logo: [],
  });

  passwordForm = this.formBuilder.group({
    password: ['', [Validators.required, Validators.minLength(MIN_PASSWORD_LENGTH)]],
    passwordConfirm: ['', [SamePassword('password')]],
  });

  ident: string | undefined;
  logo_image = '';
  error: string | undefined;
  file_changed: boolean | undefined;
  image_b64: string | undefined;
  password_changed: boolean = false;

  private unsubscribeAll: Subject<void>;

  constructor(
    private formBuilder: FormBuilder,
    private cd: ChangeDetectorRef,
    private translate: TranslateService,
    private _translateService: TranslateService,
    private _location: Location,
    private api: APIService,
    private sdk: SDKService,
  ) {
    this.unsubscribeAll = new Subject();
  }

  ngOnInit() {
    this.ident = this.sdk.nuclia.auth.getJWTUser()?.sub;
    this.api
      .get('/' + UPDATE_PREFS, true, undefined, true)
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe((res) => {
        const profile = res as UserPreferences;
        this.profileForm.get('name')?.setValue(profile.name);
        this.profileForm.get('language')?.setValue(profile.language?.toLowerCase());
        this.profileForm.get('email')?.setValue(profile.email);
        //this.profileForm.get('logo')?.setValue(profile.picture);
      });
    this.file_changed = false;
  }

  onFileChange(event: Event) {
    const reader = new FileReader();
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length) {
      const file: File = (target.files as FileList)[0];
      reader.onload = (e) => {
        const img = new Image();
        img.src = (<FileReader>e.target).result as string;
        img.onload = () => {
          const elem = document.createElement('canvas');
          elem.width = 400;
          elem.height = 400;
          const ctx = elem.getContext('2d');
          ctx?.drawImage(img, 0, 0, 400, 400);
          const data = ctx?.canvas.toDataURL();
          this.profileForm.patchValue({
            logo: data,
          });
          this.image_b64 = data;
          // need to run CD since file load runs outside of zone
          this.cd.markForCheck();
        };
      };
      reader.readAsDataURL(file);
    }
    this.file_changed = true;
  }

  do() {
    if (this.profileForm.valid) {
      const payload = {
        name: this.profileForm.value.name,
        email: this.profileForm.value.email,
        locale: this.profileForm.value.language,
        picture: undefined,
      };
      const url = '/' + UPDATE_PREFS;
      if (this.file_changed) {
        payload['picture'] = this.profileForm.value.logo;
      }
      this.api
        .patch(url, payload, true, 'application/json', true)
        .pipe(takeUntil(this.unsubscribeAll))
        .subscribe(
          () => {
            // this.api.getWelcome();
            this.translate.use(this.profileForm.value.language); // Set your language here
            this._location.back();
          },
          (error) => {
            if (error.status === 401) {
              this._translateService.get('errors.auth').subscribe((res) => (this.error = res));
            } else if (error.status === 409) {
              this._translateService.get('errors.conflict').subscribe((res) => (this.error = res));
            } else {
              this._translateService.get('errors.generic').subscribe((res) => (this.error = res));
            }
          },
        );
    } else {
      this.error = 'Invalid form';
    }
  }

  changePassword() {
    if (this.passwordForm.valid) {
      this.sdk.nuclia.auth.setPassword(this.passwordForm.value.password).subscribe((success) => {
        if (success) {
          this.password_changed = true;
        }
      });
    }
  }
}
