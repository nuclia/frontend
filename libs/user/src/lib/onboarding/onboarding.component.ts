import { ChangeDetectionStrategy, Component } from '@angular/core';
import { OnboardingService } from './onboarding.service';
import { Zone, ZoneService } from '@flaps/core';
import { Observable } from 'rxjs';
import { KbConfiguration, OnboardingPayload, OnboardingStep } from './onboarding.models';

@Component({
  selector: 'nus-onboarding',
  templateUrl: './onboarding.component.html',
  styleUrls: ['./onboarding.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OnboardingComponent {
  zones: Observable<Zone[]> = this.zoneService.getZones(true);
  onboardingStep: Observable<OnboardingStep> = this.onboardingService.onboardingStep;

  private step1Data?: OnboardingPayload;

  constructor(
    private onboardingService: OnboardingService,
    private zoneService: ZoneService,
  ) {}

  onStep1Done(data: OnboardingPayload) {
    this.step1Data = data;
    this.onboardingService.saveOnboardingInquiry(data);
  }
  onStep2Done(data: KbConfiguration) {
    if (this.step1Data) {
      this.onboardingService.startOnboarding({ ...data, company: this.step1Data.company });
    }
  }
}
