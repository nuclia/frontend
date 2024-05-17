import { ChangeDetectionStrategy, Component } from '@angular/core';
import { OnboardingService } from './onboarding.service';
import { AccountAndKbConfiguration } from '@flaps/core';
import { Observable } from 'rxjs';
import { OnboardingPayload } from './onboarding.models';
import { EmbeddingModelForm } from './language-field';

@Component({
  selector: 'nus-onboarding',
  templateUrl: './onboarding.component.html',
  styleUrls: ['./onboarding.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OnboardingComponent {
  onboardingStep: Observable<number> = this.onboardingService.onboardingStep;
  lastStep = 5;

  onboardingInquiryPayload?: OnboardingPayload;
  kbName = '';
  zone = '';
  embeddingModel?: EmbeddingModelForm;

  constructor(private onboardingService: OnboardingService) {}

  goBack(): void {
    this.onboardingService.previousStep();
  }

  storeKbNameAndGoNext($event: string) {
    this.kbName = $event;
    this.onboardingService.nextStep();
  }

  storeZoneAndGoNext($event: string) {
    this.zone = $event;
    this.onboardingService.nextStep();
  }

  finalStepDone(model: EmbeddingModelForm) {
    this.embeddingModel = model;

    if (!this.onboardingInquiryPayload) {
      return;
    }
    this.onboardingService.nextStep();
    this.onboardingService.saveOnboardingInquiry(this.onboardingInquiryPayload);
    const accountAndKb: AccountAndKbConfiguration = {
      company: this.onboardingInquiryPayload.company,
      kbName: this.kbName,
      zoneSlug: this.zone,
      semanticModel: this.embeddingModel.embeddingModel,
    };
    this.onboardingService.startOnboarding(accountAndKb);
  }
}
