import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { OnboardingService } from './onboarding.service';
import { AnalyticsService, NavigationService, SDKService, STFUtils } from '@flaps/core';
import { Observable, of, ReplaySubject, tap } from 'rxjs';
import { OnboardingPayload } from './onboarding.models';
import { Account, KnowledgeBoxCreation, LearningConfigurations } from '@nuclia/core';
import { LearningConfigurationForm } from './embeddings-model-form';
import { CommonModule } from '@angular/common';
import { UserContainerComponent } from '@nuclia/user';
import { TranslateModule } from '@ngx-translate/core';
import { Step1Component } from './step1/step1.component';
import { EmbeddingModelStepComponent, KbNameStepComponent, ZoneStepComponent } from './kb-creation-steps';
import { SettingUpComponent } from './setting-up/setting-up.component';

@Component({
  selector: 'nus-onboarding',
  templateUrl: './onboarding.component.html',
  styleUrls: ['./onboarding.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    UserContainerComponent,
    TranslateModule,
    Step1Component,
    KbNameStepComponent,
    SettingUpComponent,
    ZoneStepComponent,
    EmbeddingModelStepComponent,
  ],
})
export class OnboardingComponent {
  onboardingStep: Observable<number> = this.onboardingService.onboardingStep;
  lastStep = 5;

  onboardingInquiryPayload?: OnboardingPayload;
  kbName = '';
  zone = '';

  learningSchemasByZone: { [zone: string]: LearningConfigurations } = {};
  learningSchema = new ReplaySubject<LearningConfigurations>(1);

  learningConfig?: LearningConfigurationForm;
  account?: Account;
  creatingAccount = false;
  inRaoApp = this.navigation.inRaoApp;

  constructor(
    private onboardingService: OnboardingService,
    private sdk: SDKService,
    private cdr: ChangeDetectorRef,
    private analytics: AnalyticsService,
    private navigation: NavigationService,
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

    this.onboardingService
      .createKb(this.account.slug, this.account.id, kbConfig, this.zone)
      .subscribe(() => this.analytics.logTrialActivation());
  }
}
