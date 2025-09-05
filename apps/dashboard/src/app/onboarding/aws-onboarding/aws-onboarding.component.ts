import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  EmbeddingModelStepComponent,
  KbNameStepComponent,
  LearningConfigurationForm,
  UserContainerModule,
  VectorDatabaseStepComponent,
  ZoneStepComponent,
} from '@nuclia/user';
import { AccountBudget, BillingService, FeaturesService, NavigationService, SDKService, STFUtils } from '@flaps/core';
import { Step1BudgetComponent } from './step1-budget/step1-budget.component';
import { filter, of, ReplaySubject, switchMap, take, tap } from 'rxjs';
import { SisProgressModule, SisToastService } from '@nuclia/sistema';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ExternalIndexProvider, KnowledgeBoxCreation, LearningConfigurations } from '@nuclia/core';
import { AwsSetupAccountComponent } from './aws-setup-account/aws-setup-account.component';
import { PasswordFormComponent } from '../invite/password-form.component';

@Component({
  imports: [
    CommonModule,
    Step1BudgetComponent,
    UserContainerModule,
    KbNameStepComponent,
    ZoneStepComponent,
    EmbeddingModelStepComponent,
    TranslateModule,
    VectorDatabaseStepComponent,
    SisProgressModule,
    AwsSetupAccountComponent,
    PasswordFormComponent,
  ],
  templateUrl: './aws-onboarding.component.html',
  styleUrl: './aws-onboarding.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class AwsOnboardingComponent {
  step = -1;

  account = this.sdk.currentAccount;
  kbName = '';
  zone = '';
  learningSchemasByZone: { [zone: string]: LearningConfigurations } = {};
  learningSchema = new ReplaySubject<LearningConfigurations>(1);
  learningConfig?: LearningConfigurationForm;
  externalIndexProvider?: ExternalIndexProvider | null;

  isExternalIndexEnabled = this.featureService.unstable.externalIndex;

  constructor(
    private cdr: ChangeDetectorRef,
    private sdk: SDKService,
    private billing: BillingService,
    private toast: SisToastService,
    private router: Router,
    private navigation: NavigationService,
    private featureService: FeaturesService,
  ) {}

  goBack() {
    if (this.step > 1) {
      this.step = this.step - 1;
    }
  }

  setPassword(password: string) {
    this.sdk.nuclia.auth.setPassword(password).subscribe(() => {
      this.step = 3;
      this.cdr.markForCheck();
    });
  }

  goToBudget() {
    this.step = 1;
    this.cdr.markForCheck();
  }

  setupBudget(data: Partial<AccountBudget>) {
    this.billing.modifySubscription(data, true).subscribe({
      next: () => {
        this.step = 2;
        this.cdr.markForCheck();
      },
      error: () => {
        this.toast.warning('onboarding.aws.monthly-budget.set-up-error');
        this.step = 2;
        this.cdr.markForCheck();
      },
    });
  }

  storeKbNameAndGoNext($event: string) {
    this.kbName = $event;
    this.step++;
  }

  storeZoneAndGoNext(zone: string) {
    this.zone = zone;
    this.account
      .pipe(
        take(1),
        switchMap((account) =>
          this.learningSchemasByZone[zone]
            ? of(this.learningSchemasByZone[zone])
            : this.sdk.nuclia.db
                .getLearningSchema(account.id, zone)
                .pipe(tap((schema) => (this.learningSchemasByZone[zone] = schema))),
        ),
      )
      .subscribe((schema) => {
        this.learningSchema.next(schema);
        this.step++;
        this.cdr.markForCheck();
      });
  }

  storeLearningConfigAndGoNext(config: LearningConfigurationForm) {
    this.learningConfig = config;
    this.step++;

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
    this.step++;
    this.finalStepDone();
  }

  finalStepDone() {
    if (!this.learningConfig) {
      return;
    }
    this.account
      .pipe(
        take(1),
        switchMap((account) => {
          const kbConfig: KnowledgeBoxCreation = {
            slug: STFUtils.generateSlug(this.kbName),
            title: this.kbName,
            learning_configuration: this.learningConfig,
          };
          if (this.externalIndexProvider) {
            kbConfig.external_index_provider = this.externalIndexProvider;
          }
          return this.sdk.nuclia.db.createKnowledgeBox(account.id, kbConfig, this.zone).pipe(
            tap(() => {
              this.sdk.refreshKbList();
              this.router.navigate([this.navigation.getAccountManageUrl(account.slug)], {
                queryParams: { setup: 'invite-collaborators' },
              });
            }),
          );
        }),
      )
      .subscribe();
  }
}
