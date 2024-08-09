import { ChangeDetectionStrategy, Component } from '@angular/core';
import { OnboardingService } from './onboarding.service';
import { AccountAndKbConfiguration, FeaturesService } from '@flaps/core';
import { filter, map, Observable, take } from 'rxjs';
import { OnboardingPayload } from './onboarding.models';
import { EmbeddingModelForm } from './embeddings-model-form';
import { ExternalIndexProvider } from '@nuclia/core';

@Component({
  selector: 'nus-onboarding',
  templateUrl: './onboarding.component.html',
  styleUrls: ['./onboarding.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OnboardingComponent {
  isExternalIndexEnabled = this.featureService.unstable.externalIndex;
  onboardingStep: Observable<number> = this.onboardingService.onboardingStep;
  lastStep: Observable<number> = this.isExternalIndexEnabled.pipe(
    map((isExternalIndexEnabled) => (isExternalIndexEnabled ? 6 : 5)),
  );

  onboardingInquiryPayload?: OnboardingPayload;
  kbName = '';
  zone = '';
  embeddingModel?: EmbeddingModelForm;
  externalIndexProvider?: ExternalIndexProvider | null;

  constructor(
    private onboardingService: OnboardingService,
    private featureService: FeaturesService,
  ) {}

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

  storeEmbeddingModelAndGoNext(model: EmbeddingModelForm) {
    this.embeddingModel = model;
    this.onboardingService.nextStep();

    // there is one more step only if external index is enabled
    this.isExternalIndexEnabled
      .pipe(
        take(1),
        filter((isEnabled) => !isEnabled),
      )
      .subscribe(() => this.finalStepDone());
  }

  storeVectorDbStep(indexProvider: ExternalIndexProvider | null) {
    this.externalIndexProvider = indexProvider;
    this.onboardingService.nextStep();
    this.finalStepDone();
  }

  private finalStepDone() {
    if (!this.onboardingInquiryPayload || !this.embeddingModel) {
      return;
    }
    this.onboardingService.saveOnboardingInquiry(this.onboardingInquiryPayload);
    const accountAndKb: AccountAndKbConfiguration = {
      company: this.onboardingInquiryPayload.company,
      kbName: this.kbName,
      zoneSlug: this.zone,
      semanticModel: this.embeddingModel.embeddingModel,
      externalIndexProvider: this.externalIndexProvider,
    };
    this.onboardingService.startOnboarding(accountAndKb);
  }
}
