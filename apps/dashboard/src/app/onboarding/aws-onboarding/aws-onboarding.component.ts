import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  EmbeddingModelForm,
  EmbeddingModelStepComponent,
  KbNameStepComponent,
  UserContainerModule,
  ZoneStepComponent,
} from '@nuclia/user';
import { BillingService, getSemanticModel, NavigationService, SDKService, STFUtils } from '@flaps/core';
import { Step1BudgetComponent } from './step1-budget/step1-budget.component';
import { Observable, of, switchMap, take } from 'rxjs';
import { SisToastService } from '@nuclia/sistema';
import { Step2Component } from './step2/step2.component';
import { Router } from '@angular/router';
import { Step3KbComponent } from './step3-kb/step3-kb.component';

@Component({
  selector: 'app-aws-onboarding',
  standalone: true,
  imports: [
    CommonModule,
    Step1BudgetComponent,
    UserContainerModule,
    Step2Component,
    Step3KbComponent,
    KbNameStepComponent,
    ZoneStepComponent,
    EmbeddingModelStepComponent,
  ],
  templateUrl: './aws-onboarding.component.html',
  styleUrl: './aws-onboarding.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class AwsOnboardingComponent {
  step = 1;

  account = this.sdk.currentAccount;

  budget: number | null = null;
  choice: 'createKB' | 'inviteOwner' | null = null;

  kbName = '';
  zone = '';
  embeddingModel?: EmbeddingModelForm;

  constructor(
    private cdr: ChangeDetectorRef,
    private sdk: SDKService,
    private billing: BillingService,
    private toast: SisToastService,
    private router: Router,
    private navigation: NavigationService,
  ) {}

  goBack() {
    if (this.step > 1) {
      this.step = this.step - 1;
    }
  }

  setupBudget(data: { budget: number | null }) {
    this.budget = data.budget;
    const request: Observable<void | boolean> =
      data.budget !== null ? this.billing.modifySubscription({ on_demand_budget: data.budget }, true) : of(true);
    request.subscribe({
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

  goFrom2ToNext($event: { choice: 'createKB' | 'inviteOwner' }) {
    this.choice = $event.choice;
    if (this.choice === 'createKB') {
      this.step = 3;
    } else {
      this.account.subscribe((account) =>
        this.router.navigate([this.navigation.getAccountManageUrl(account.slug)], {
          queryParams: { setup: 'invite-collaborators' },
        }),
      );
    }
  }

  storeKbNameAndGoNext($event: string) {
    this.kbName = $event;
    this.step++;
  }

  storeZoneAndGoNext($event: string) {
    this.zone = $event;
    this.step++;
  }

  finalStepDone(model: EmbeddingModelForm) {
    this.embeddingModel = model;

    this.account
      .pipe(
        take(1),
        switchMap((account) =>
          this.sdk.nuclia.db.getLearningSchema(account.id, this.zone).pipe(
            switchMap((learningConfiguration) => {
              const kbConfig = {
                slug: STFUtils.generateSlug(this.kbName),
                title: this.kbName,
                learning_configuration: {
                  semantic_model: getSemanticModel(model.embeddingModel, learningConfiguration),
                },
              };
              return this.sdk.nuclia.db.createKnowledgeBox(account.id, kbConfig, this.zone);
            }),
          ),
        ),
      )
      .subscribe((account) =>
        this.router.navigate([this.navigation.getAccountManageUrl(account.slug)], {
          queryParams: { setup: 'invite-collaborators' },
        }),
      );
  }
}
