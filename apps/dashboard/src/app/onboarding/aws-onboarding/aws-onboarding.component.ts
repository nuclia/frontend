import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserContainerModule } from '@nuclia/user';
import { BillingService, NavigationService, SDKService } from '@flaps/core';
import { Step1BudgetComponent } from './step1-budget/step1-budget.component';
import { Observable, of } from 'rxjs';
import { SisToastService } from '@nuclia/sistema';
import { Step2Component } from './step2/step2.component';
import { Router } from '@angular/router';
import { Step3KbComponent } from './step3-kb/step3-kb.component';

@Component({
  selector: 'app-aws-onboarding',
  standalone: true,
  imports: [CommonModule, Step1BudgetComponent, UserContainerModule, Step2Component, Step3KbComponent],
  templateUrl: './aws-onboarding.component.html',
  styleUrl: './aws-onboarding.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class AwsOnboardingComponent {
  step = 1;

  account = this.sdk.currentAccount;

  constructor(
    private cdr: ChangeDetectorRef,
    private sdk: SDKService,
    private billing: BillingService,
    private toast: SisToastService,
    private router: Router,
    private navigation: NavigationService,
  ) {}

  setupBudget(data: { budget: number | null }) {
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
    if ($event.choice === 'createKB') {
      this.step = 3;
    } else {
      this.account.subscribe((account) =>
        this.router.navigate([this.navigation.getAccountManageUrl(account.slug)], {
          queryParams: { setup: 'invite-collaborators' },
        }),
      );
    }
  }

  goFrom3ToNext() {
    this.sdk.refreshKbList();
    this.account.subscribe((account) =>
      this.router.navigate([this.navigation.getAccountManageUrl(account.slug)], {
        queryParams: { setup: 'invite-collaborators' },
      }),
    );
  }
}
