import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { OnboardingService, OnboardingStatus } from './onboarding.service';
import { OnboardingPayload } from './onboarding.models';
import { Zone, ZoneService } from '@flaps/core';
import { Observable } from 'rxjs';

const PHONE_INTERNATIONAL_CODE = new RegExp(/^[+][0-9s]+$/);
const PHONE_NUMBER = new RegExp(/^[0-9\s]+$/);

@Component({
  selector: 'nus-onboarding',
  templateUrl: './onboarding.component.html',
  styleUrls: ['./onboarding.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OnboardingComponent implements OnInit {
  onboardingForm = new FormGroup({
    company: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    use_case: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    hosted_nucliadb: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
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
    hosted_nucliadb: { required: 'validation.required' },
    organization_size: { required: 'validation.required' },
    phoneInternationalCode: { required: 'validation.required_short', pattern: 'onboarding.invalid_phone_code' },
    phoneNumber: { required: 'validation.required', pattern: 'onboarding.invalid_phone_number' },
  };

  zones: Zone[] = [];
  onboardingStatus: Observable<OnboardingStatus> = this.onboardingService.onboardingState;

  constructor(
    private onboardingService: OnboardingService,
    private zoneService: ZoneService,
  ) {
    this.zoneService.getZones().subscribe((zones) => (this.zones = zones));
  }

  ngOnInit(): void {
    this.onboardingForm.get('company')?.markAsDirty();
    this.onboardingForm.get('use_case')?.markAsDirty();
    this.onboardingForm.get('hosted_nucliadb')?.markAsDirty();
    this.onboardingForm.get('organization_size')?.markAsDirty();
    this.onboardingForm.get('phoneInternationalCode')?.markAsDirty();
    this.onboardingForm.get('phoneNumber')?.markAsDirty();
  }

  submitForm() {
    if (this.onboardingForm.invalid) {
      return;
    }
    const formValue = this.onboardingForm.getRawValue();
    const data: OnboardingPayload = {
      company: formValue.company,
      use_case: formValue.use_case,
      hosted_nucliadb: formValue.hosted_nucliadb === 'yes',
      organization_size: formValue.organization_size,
      phone: formValue.phoneNumber ? `${formValue.phoneInternationalCode} ${formValue.phoneNumber}` : undefined,
      receive_updates: formValue.getUpdates,
    };
    this.onboardingService.startOnboarding(data, this.zones[0].id);
  }
}
