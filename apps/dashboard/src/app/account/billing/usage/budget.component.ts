import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { AccountBudget, BillingService, Currency } from '@flaps/core';
import { filter, map, startWith, Subject, takeUntil } from 'rxjs';
import { FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-budget',
  templateUrl: './budget.component.html',
  styleUrls: ['./budget.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BudgetComponent implements OnDestroy {
  budgetValidators = [Validators.required, Validators.min(1)];
  form = new FormGroup({
    budget: new FormControl<number | null>(null, { validators: this.budgetValidators }),
    type: new FormControl<'unlimited' | 'limited' | null>(null, { validators: [Validators.required] }),
    action: new FormControl<'BLOCK_ACCOUNT' | 'WARN_ACCOUNT_OWNER'>('BLOCK_ACCOUNT', {
      validators: [Validators.required],
    }),
  });
  unsubscribeAll = new Subject<void>();

  @Input() currency: Currency | undefined;
  @Input() showActions: boolean = true;
  @Output() budgetChange = new EventEmitter<Partial<AccountBudget> | undefined>();

  constructor(private billing: BillingService) {
    this.billing
      .getSubscription()
      .pipe(
        filter((subscription) => !!subscription),
        map((subscription) => {
          const budget = subscription?.subscription?.on_demand_budget;
          return {
            budget: typeof budget === 'number' ? budget : null,
            action: subscription?.subscription?.action_on_budget_exhausted || 'BLOCK_ACCOUNT',
          };
        }),
      )
      .subscribe(({ budget, action }) => {
        const type = typeof budget === 'number' ? 'limited' : 'unlimited';
        this.form.patchValue({ budget, action, type });
        this.updateValidation(type);
        this.budgetChange.emit({
          on_demand_budget: budget,
          action_on_budget_exhausted: this.showActions ? action : undefined,
        });
      });

    this.form.valueChanges
      .pipe(
        startWith(this.form.getRawValue()),
        map((values) => {
          this.budgetChange.emit(
            this.form.valid
              ? {
                  on_demand_budget: values.type === 'limited' ? (values.budget as number) : null,
                  action_on_budget_exhausted: this.showActions && values.type === 'limited' ? values.action : undefined,
                }
              : undefined,
          );
        }),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe();
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  updateValidation(type: 'limited' | 'unlimited') {
    type === 'limited'
      ? this.form.controls.budget.addValidators(this.budgetValidators)
      : this.form.controls.budget.removeValidators(this.budgetValidators);
    this.form.controls.budget.updateValueAndValidity();
  }
}
