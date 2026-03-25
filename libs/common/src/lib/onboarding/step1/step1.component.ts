import { ChangeDetectionStrategy, Component, effect, EventEmitter, inject, Input, Output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { PaButtonModule, PaIconModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { AwsOnboardingPayload, OnboardingPayload } from '../onboarding.models';
import { COUNTRIES, CountrySelectComponent, StickyFooterComponent } from '@nuclia/sistema';
import { FeaturesService } from '@flaps/core';

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
    CountrySelectComponent,
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

  private featuresService = inject(FeaturesService);
  hasSignupOnProgressCom = toSignal(this.featuresService.unstable.progressComSignup, { initialValue: false });
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
    acceptPrivacyPolicy: new FormControl<boolean>(false, { nonNullable: true, validators: [Validators.requiredTrue] }),
  });

  constructor() {
    effect(() => {
      this.updateForm(this._isAws);
    });
  }

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
      country: COUNTRIES[formValue.country] || formValue.country,
      phone: `${formValue.phoneInternationalCode} ${formValue.phoneNumber}`,
      receive_updates: formValue.getUpdates,
      accept_privacy_policy: formValue.acceptPrivacyPolicy,
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
    const hideInquiryFields = this.hasSignupOnProgressCom();

    this.onboardingForm.controls.first_name.setValidators(isAws && !hideInquiryFields ? [Validators.required] : []);
    this.onboardingForm.controls.last_name.setValidators(isAws && !hideInquiryFields ? [Validators.required] : []);
    this.onboardingForm.controls.owner_email_address.setValidators(
      isAws && !hideInquiryFields ? [Validators.required, Validators.email] : [],
    );
    this.onboardingForm.controls.company.setValidators(hideInquiryFields ? [] : [Validators.required]);
    this.onboardingForm.controls.use_case.setValidators(hideInquiryFields ? [] : [Validators.required]);
    this.onboardingForm.controls.role.setValidators(hideInquiryFields ? [] : [Validators.required]);
    this.onboardingForm.controls.organization_size.setValidators(hideInquiryFields ? [] : [Validators.required]);
    this.onboardingForm.controls.country.setValidators(hideInquiryFields ? [] : [Validators.required]);
    this.onboardingForm.controls.phoneInternationalCode.setValidators(
      hideInquiryFields ? [] : [Validators.required, Validators.pattern(PHONE_INTERNATIONAL_CODE)],
    );
    this.onboardingForm.controls.phoneNumber.setValidators(
      hideInquiryFields ? [] : [Validators.required, Validators.pattern(PHONE_NUMBER)],
    );
    this.onboardingForm.controls.first_name.updateValueAndValidity();
    this.onboardingForm.controls.last_name.updateValueAndValidity();
    this.onboardingForm.controls.owner_email_address.updateValueAndValidity();
    this.onboardingForm.controls.company.updateValueAndValidity();
    this.onboardingForm.controls.use_case.updateValueAndValidity();
    this.onboardingForm.controls.role.updateValueAndValidity();
    this.onboardingForm.controls.organization_size.updateValueAndValidity();
    this.onboardingForm.controls.country.updateValueAndValidity();
    this.onboardingForm.controls.phoneInternationalCode.updateValueAndValidity();
    this.onboardingForm.controls.phoneNumber.updateValueAndValidity();
  }
}
