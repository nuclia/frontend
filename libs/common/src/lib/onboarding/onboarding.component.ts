import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import {
  AnalyticsService,
  FeaturesService,
  NavigationService,
  SDKService,
  SelectAccountKbService,
  STFUtils,
  UserService,
} from '@flaps/core';
import { PaButtonModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { Account, KnowledgeBoxCreation, LearningConfigurations, SignUpInfo, WorkflowType } from '@nuclia/core';
import { UserContainerComponent } from '@nuclia/user';
import { catchError, map, Observable, of, ReplaySubject, switchMap, take, tap } from 'rxjs';
import { AccountWorkflowComponent } from './account-workflow/account-workflow.component';
import { CompanyNameComponent } from './company-name/company-name.component';
import { LearningConfigurationForm } from './embeddings-model-form';
import { EmbeddingModelStepComponent, ZoneStepComponent } from './kb-creation-steps';
import { OnboardingPayload } from './onboarding.models';
import { OnboardingService } from './onboarding.service';
import { SettingUpComponent } from './setting-up/setting-up.component';
import { Step1Component } from './step1/step1.component';

@Component({
  selector: 'nus-onboarding',
  templateUrl: './onboarding.component.html',
  styleUrls: ['./onboarding.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AccountWorkflowComponent,
    CommonModule,
    UserContainerComponent,
    TranslateModule,
    Step1Component,
    SettingUpComponent,
    ZoneStepComponent,
    EmbeddingModelStepComponent,
    PaButtonModule,
    CompanyNameComponent,
  ],
})
export class OnboardingComponent {
  private readonly onboardingService = inject(OnboardingService);
  private readonly sdk = inject(SDKService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly analytics = inject(AnalyticsService);
  private readonly navigation = inject(NavigationService);
  private readonly userService = inject(UserService);
  private readonly selectAccountKbService = inject(SelectAccountKbService);
  private readonly featuresService = inject(FeaturesService);

  onboardingStep: Observable<number> = this.onboardingService.onboardingStep;
  lastStep = 5;

  onboardingInquiryPayload?: OnboardingPayload;
  zone = '';
  isCowork = false;

  learningSchemasByZone: { [zone: string]: LearningConfigurations } = {};
  learningSchema = new ReplaySubject<LearningConfigurations>(1);

  learningConfig?: LearningConfigurationForm;
  account?: Account;
  creatingAccount = false;
  enterCompanyName = false;
  inRaoApp = this.navigation.inRaoApp;
  showLogout = false;

  goBack(): void {
    this.onboardingService.previousStep();
  }

  createAccountAndInquiry($event: OnboardingPayload | null) {
    this.cdr.markForCheck();
    if ($event) {
      this.onboardingInquiryPayload = $event;
      this.onboardingService.saveOnboardingInquiry(this.onboardingInquiryPayload);
    }

    this.selectAccountKbService
      .loadAccounts()
      .pipe(
        switchMap((accounts) => {
          if (accounts.length > 0) {
            // Account already exists for this user (e.g. onboarding page reloaded after a successful
            // creation) — don't attempt to create another one, just continue to the existing account.
            this.navigation.goToLandingPage();
            return of(null);
          }
          return this.onboardingService.getSignUpData().pipe(
            switchMap((data) => {
              if (data) {
                return this.createAccount(data);
              } else {
                this.enterCompanyName = true;
                this.cdr.markForCheck();
                return of(null);
              }
            }),
          );
        }),
      )
      .subscribe();
  }

  createAccount(data: SignUpInfo) {
    this.creatingAccount = true;
    return this.onboardingService.createAccount(data).pipe(
      take(1),
      tap((account) => {
        this.account = account;
        this.creatingAccount = false;
        // Register the new account in SDKService so zone-scoped API calls (e.g. zone list) work
        this.sdk.setCurrentAccount(account.slug).pipe(take(1)).subscribe();
        if (this.account.workflow === 'cowork') {
          this.isCowork = true;
        }
        this.onboardingService.nextStep();
      }),
      catchError((error) => {
        this.showLogout = true;
        this.cdr.markForCheck();
        return of(error);
      }),
    );
  }

  createAccountFallback(company: string) {
    this.userService.userInfo
      .pipe(
        take(1),
        switchMap((userInfo) => {
          return this.createAccount({
            company,
            email: userInfo?.preferences.email || '',
            fullname: userInfo?.preferences.name || '',
          });
        }),
      )
      .subscribe();
  }

  storeWorkflowAndGoNext(workflow: WorkflowType) {
    if (workflow === 'cowork') {
      this.isCowork = true;
    }
    this.onboardingService.setSteps(workflow);
    this.onboardingService.modifyAccount(this.account?.slug || '', { workflow }).subscribe(() => {
      this.onboardingService.nextStep();
    });
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

  logout() {
    this.sdk.nuclia.auth.logout();
  }

  private finalStepDone() {
    if (!this.account || !this.learningConfig) {
      return;
    }

    const account = this.account;
    const kbName = this.isCowork ? this.onboardingService.contextBoxKbName : this.onboardingService.knowledgeBoxKbName;
    const kbConfig: KnowledgeBoxCreation = {
      slug: STFUtils.generateSlug(kbName),
      title: kbName,
      learning_configuration: this.learningConfig,
      zone: this.zone,
      enforce_security: true,
    };

    const contextBoxModel = this.onboardingService.contextBoxDefaultModel;
    const kbCreationRequest = this.isCowork
      ? this.learningSchema.pipe(
          map((schema) => {
            if (schema['generative_model'].options?.find((model) => model.value === contextBoxModel)) {
              if (kbConfig.learning_configuration) {
                kbConfig.learning_configuration['generative_model'] = contextBoxModel;
              } else {
                kbConfig.learning_configuration = { generative_model: contextBoxModel };
              }
            }
            return kbConfig;
          }),
          switchMap((config) => this.onboardingService.createContextBox(account.slug, account.id, config, this.zone)),
        )
      : this.onboardingService.createKb(account.slug, account.id, kbConfig, this.zone);

    kbCreationRequest.subscribe(() => this.analytics.logTrialActivation());
  }
}
