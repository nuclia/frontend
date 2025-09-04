import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import {
  OptionModel,
  PaButtonModule,
  PaIconModule,
  PaTextFieldModule,
  PaTogglesModule,
} from '@guillotinaweb/pastanaga-angular';
import { AwsOnboardingPayload, OnboardingPayload } from '../onboarding.models';
import { StickyFooterComponent } from '@nuclia/sistema';
import { COUNTRIES } from '@flaps/core';

const PHONE_INTERNATIONAL_CODE = new RegExp(/^[+][0-9s]+$/);
const PHONE_NUMBER = new RegExp(/^[0-9\s]+$/);

@Component({
  selector: 'nus-onboarding-step1',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    PaTextFieldModule,
    PaButtonModule,
    PaIconModule,
    PaTogglesModule,
    StickyFooterComponent,
  ],
  templateUrl: './step1.component.html',
  styleUrls: ['../_common-step.scss', './step1.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Step1Component {
  @Input() set data(value: OnboardingPayload | undefined) {
    if (value) {
      const [phoneInternationalCode, phoneNumber] = value.phone.split(' ');
      this.onboardingForm.patchValue({ ...value, phoneInternationalCode, phoneNumber });
      this.consent.patchValue(true);
    }
  }
  @Input() set isAws(value: boolean | undefined) {
    this._isAws = !!value;
    this.updateForm(this._isAws);
  }
  get isAws() {
    return this._isAws;
  }
  private _isAws = false;

  @Output() submitStep1 = new EventEmitter<OnboardingPayload>();
  @Output() submitStep1Aws = new EventEmitter<AwsOnboardingPayload>();

  onboardingForm = new FormGroup({
    first_name: new FormControl<string>('', { nonNullable: true }),
    last_name: new FormControl<string>('', { nonNullable: true }),
    owner_email_address: new FormControl<string>('', {
      nonNullable: true,
      updateOn: 'blur',
    }),
    company: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    use_case: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    role: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    organization_size: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    country: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    phoneInternationalCode: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(PHONE_INTERNATIONAL_CODE)],
    }),
    phoneNumber: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(PHONE_NUMBER)],
    }),
    getUpdates: new FormControl<boolean>(true, { nonNullable: true }),
  });

  validationMessages = {
    first_name: { required: 'validation.required' },
    last_name: { required: 'validation.required' },
    owner_email_address: { required: 'validation.required', email: 'validation.email' },
    company: { required: 'validation.required' },
    use_case: { required: 'validation.required' },
    role: { required: 'validation.required' },
    organization_size: { required: 'validation.required' },
    country: { required: 'validation.required' },
    phoneInternationalCode: { required: 'validation.required_short', pattern: 'onboarding.step1.invalid_phone_code' },
    phoneNumber: { required: 'validation.required', pattern: 'onboarding.step1.invalid_phone_number' },
  };

  consent = new FormControl<boolean>(false, [Validators.required]);
  countries = Object.values(COUNTRIES).map(
    (country) => new OptionModel({ id: country, label: country, value: country }),
  );

  submitForm() {
    if (this.onboardingForm.invalid) {
      return;
    }
    const formValue = this.onboardingForm.getRawValue();
    const data: OnboardingPayload = {
      company: formValue.company,
      use_case: formValue.use_case,
      role: formValue.role,
      organization_size: formValue.organization_size,
      country: formValue.country,
      phone: `${formValue.phoneInternationalCode} ${formValue.phoneNumber}`,
      receive_updates: formValue.getUpdates,
    };
    if (this.isAws) {
      this.submitStep1Aws.emit({
        ...data,
        first_name: formValue.first_name,
        last_name: formValue.last_name,
        owner_email_address: formValue.owner_email_address,
      });
    } else {
      this.submitStep1.emit(data);
    }
  }

  updateForm(isAws: boolean) {
    this.onboardingForm.controls.first_name.setValidators(isAws ? [Validators.required] : []);
    this.onboardingForm.controls.last_name.setValidators(isAws ? [Validators.required] : []);
    this.onboardingForm.controls.owner_email_address.setValidators(
      isAws ? [Validators.required, Validators.email] : [],
    );
    this.onboardingForm.controls.first_name.updateValueAndValidity();
    this.onboardingForm.controls.last_name.updateValueAndValidity();
    this.onboardingForm.controls.owner_email_address.updateValueAndValidity();
  }
}
