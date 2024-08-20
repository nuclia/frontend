import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { OnboardingService } from './onboarding.service';
import { FeaturesService, SDKService, STFUtils } from '@flaps/core';
import { filter, map, Observable, of, ReplaySubject, take, tap } from 'rxjs';
import { OnboardingPayload } from './onboarding.models';
import { Account, ExternalIndexProvider, KnowledgeBoxCreation, LearningConfigurations } from '@nuclia/core';
import { LearningConfigurationForm } from './embeddings-model-form';

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

  learningSchemasByZone: { [zone: string]: LearningConfigurations } = {};
  learningSchema = new ReplaySubject<LearningConfigurations>(1);

  learningConfig?: LearningConfigurationForm;
  externalIndexProvider?: ExternalIndexProvider | null;
  account?: Account;
  creatingAccount = false;

  constructor(
    private onboardingService: OnboardingService,
    private featureService: FeaturesService,
    private sdk: SDKService,
    private cdr: ChangeDetectorRef,
  ) {}

  goBack(): void {
    this.onboardingService.previousStep();
  }

  createAccountAndInquiry($event: OnboardingPayload) {
    this.creatingAccount = true;
    this.cdr.markForCheck();
    this.onboardingInquiryPayload = $event;
    this.onboardingService.saveOnboardingInquiry(this.onboardingInquiryPayload);
    this.onboardingService.createAccount(this.onboardingInquiryPayload.company).subscribe((account) => {
      this.account = account;
      this.creatingAccount = false;
      this.onboardingService.nextStep();
    });
  }

  storeKbNameAndGoNext($event: string) {
    this.kbName = $event;
    this.onboardingService.nextStep();
  }

  storeZoneAndGoNext(zone: string) {
    this.zone = zone;
    if (this.account) {
      const learningSchema$ = this.learningSchemasByZone[zone]
        ? of(this.learningSchemasByZone[zone])
        : this.sdk.nuclia.db
            .getLearningSchema(this.account.id, zone)
            .pipe(tap((schema) => (this.learningSchemasByZone[zone] = schema)));
      learningSchema$.subscribe((schema) => {
        this.learningSchema.next(schema);
        this.onboardingService.nextStep();
      });
    }
  }

  storeLearningConfigAndGoNext(config: LearningConfigurationForm) {
    this.learningConfig = config;
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
    if (!this.account || !this.learningConfig) {
      return;
    }

    const kbConfig: KnowledgeBoxCreation = {
      slug: STFUtils.generateSlug(this.kbName),
      title: this.kbName,
      learning_configuration: this.learningConfig,
      zone: this.zone,
    };

    if (this.externalIndexProvider) {
      kbConfig.external_index_provider = this.externalIndexProvider;
    }

    this.onboardingService.createKb(this.account.slug, this.account.id, kbConfig, this.zone).subscribe();
  }
}
