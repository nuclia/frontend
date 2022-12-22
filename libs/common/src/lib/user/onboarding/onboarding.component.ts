import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { OnboardingService, OnboardingStatus } from './onboarding.service';
import { OnboardingPayload } from './onboarding.models';
import { Zone, ZoneService } from '@flaps/core';
import { Observable } from 'rxjs';

@Component({
  selector: 'stf-onboarding',
  templateUrl: './onboarding.component.html',
  styleUrls: ['./onboarding.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OnboardingComponent {
  onboardingForm = new FormGroup({
    industry: new FormControl<string>(''),
    searchEngine: new FormControl<string>(''),
    getUpdates: new FormControl<boolean>(false),
  });

  zones: Zone[] = [];
  onboardingStatus: Observable<OnboardingStatus> = this.onboardingService.onboardingState;

  constructor(private onboardingService: OnboardingService, private zoneService: ZoneService) {
    this.zoneService.getZones().subscribe((zones) => (this.zones = zones));
  }

  submitForm() {
    const data: OnboardingPayload = {
      industry: this.onboardingForm.value.industry || '',
      other_search_engines: this.onboardingForm.value.searchEngine || '',
      receive_updates: this.onboardingForm.value.getUpdates || false,
    };
    this.onboardingService.startOnboarding(data, this.zones[0].id);
  }
}
