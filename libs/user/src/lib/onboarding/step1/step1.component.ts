import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { PaButtonModule, PaIconModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { OnboardingPayload } from '../onboarding.models';
import { StickyFooterComponent } from '@nuclia/sistema';

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
    StickyFooterComponent
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

  @Output() submitStep1 = new EventEmitter<OnboardingPayload>();

  onboardingForm = new FormGroup({
    company: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    use_case: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    role: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    organization_size: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
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
    company: { required: 'validation.required' },
    use_case: { required: 'validation.required' },
    role: { required: 'validation.required' },
    organization_size: { required: 'validation.required' },
    phoneInternationalCode: { required: 'validation.required_short', pattern: 'onboarding.step1.invalid_phone_code' },
    phoneNumber: { required: 'validation.required', pattern: 'onboarding.step1.invalid_phone_number' },
  };

  consent = new FormControl<boolean>(false, [Validators.required]);

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
      phone: `${formValue.phoneInternationalCode} ${formValue.phoneNumber}`,
      receive_updates: formValue.getUpdates,
    };
    this.submitStep1.emit(data);
  }
}
