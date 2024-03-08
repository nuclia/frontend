import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { AccountUsage, BillingService } from '@flaps/core';
import { catchError, map, switchMap } from 'rxjs';
import { FormControl, Validators } from '@angular/forms';
import { SisToastService } from '@nuclia/sistema';

@Component({
  selector: 'app-budget',
  templateUrl: './budget.component.html',
  styleUrls: ['./budget.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BudgetComponent {
  isSubscribedToAws = this.billing.isSubscribedToAws;
  budget = new FormControl<string>('', { nonNullable: true, validators: [Validators.required, Validators.min(0)] });
  @Input() usage: AccountUsage | undefined;

  constructor(
    private billing: BillingService,
    private cdr: ChangeDetectorRef,
    private toaster: SisToastService,
  ) {
    this.getBudget().subscribe((budget) => {
      this.budget.setValue(budget.toString());
    });
  }

  saveBudget() {
    this.isSubscribedToAws
      .pipe(
        switchMap((isAws) =>
          this.billing.modifySubscription({ on_demand_budget: parseInt(this.budget.value) }, isAws).pipe(
            switchMap(() => this.getBudget()),
            catchError((error) => {
              this.toaster.error('generic.error.oops');
              throw error;
            }),
          ),
        ),
      )
      .subscribe((budget) => {
        this.budget.setValue(budget.toString());
        this.budget.markAsPristine();
        if (this.usage && budget < this.usage.over_cost) {
          this.toaster.warning('billing.budget_warning');
        }
        this.cdr?.markForCheck();
      });
  }

  getBudget() {
    return this.billing
      .getSubscription()
      .pipe(map((subscription) => subscription?.subscription?.on_demand_budget || 0));
  }
}
