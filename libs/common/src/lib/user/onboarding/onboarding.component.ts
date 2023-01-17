import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { OnboardingService, OnboardingStatus } from './onboarding.service';
import { OnboardingPayload } from './onboarding.models';
import { STFTrackingService, Zone, ZoneService } from '@flaps/core';
import { Observable } from 'rxjs';
import { OptionModel } from '@guillotinaweb/pastanaga-angular';
import { TranslateService } from '@ngx-translate/core';

const industries = [
  'IT_software',
  'marketing',
  'finance',
  'research',
  'education',
  'health',
  'insurance',
  'public_administration',
  'sales',
  'legal',
  'telecommunications',
  'engineering',
  'pharma',
  'startup',
  'manufacturing',
  'robotics',
  'energy',
  'chemical_industry',
  'food_service',
  'construction',
  'retail',
  'other',
];

const PHONE_INTERNATIONAL_CODE = new RegExp(/^[+][0-9s]+$/);
const PHONE_NUMBER = new RegExp(/^[0-9\s]+$/);

@Component({
  selector: 'stf-onboarding',
  templateUrl: './onboarding.component.html',
  styleUrls: ['./onboarding.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OnboardingComponent {
  onboardingForm = new FormGroup({
    company: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    industry: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    phoneInternationalCode: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.pattern(PHONE_INTERNATIONAL_CODE)],
    }),
    phoneNumber: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.pattern(PHONE_NUMBER)],
    }),
    searchEngine: new FormControl<string>('', { nonNullable: true }),
    getUpdates: new FormControl<boolean>(true, { nonNullable: true }),
  });

  validationMessages = {
    industry: { required: 'validation.required' },
    company: { required: 'validation.required' },
    phoneInternationalCode: { required: 'validation.required', pattern: 'onboarding.phone.invalid_code' },
    phoneNumber: { required: 'validation.required', pattern: 'onboarding.phone.invalid_number' },
  };

  zones: Zone[] = [];
  onboardingStatus: Observable<OnboardingStatus> = this.onboardingService.onboardingState;
  industryOptions: OptionModel[] = this.buildIndustryList();

  constructor(
    private onboardingService: OnboardingService,
    private zoneService: ZoneService,
    private translate: TranslateService,
    private tracking: STFTrackingService,
  ) {
    this.zoneService.getZones().subscribe((zones) => (this.zones = zones));
    this.tracking.isFeatureEnabled('mandatory-phone').subscribe((enabled) => {
      if (enabled) {
        this.onboardingForm.get('phoneInternationalCode')?.setValidators([Validators.required]);
        this.onboardingForm.get('phoneNumber')?.setValidators([Validators.required]);
        // force validation to be refreshed
        this.onboardingForm.patchValue({ phoneNumber: '' });
        this.onboardingForm.updateValueAndValidity();
      }
    });
  }

  submitForm() {
    if (this.onboardingForm.invalid) {
      return;
    }
    const formValue = this.onboardingForm.getRawValue();
    const data: OnboardingPayload = {
      company: formValue.company,
      industry: formValue.industry,
      phone: formValue.phoneNumber ? `${formValue.phoneInternationalCode} ${formValue.phoneNumber}` : undefined,
      other_search_engines: formValue.searchEngine,
      receive_updates: formValue.getUpdates,
    };
    this.onboardingService.startOnboarding(data, this.zones[0].id);
  }

  private buildIndustryList(): OptionModel[] {
    const list = industries
      .map(
        (industry) =>
          new OptionModel({
            id: industry,
            value: industry,
            label: this.translate.instant(`onboarding.industry.${industry}`),
          }),
      )
      .sort((a, b) => a.label.toLocaleLowerCase().localeCompare(b.label.toLocaleLowerCase()));
    list.push(
      new OptionModel({
        id: 'other',
        value: 'other',
        label: this.translate.instant('onboarding.industry.other'),
      }),
    );
    return list;
  }
}
