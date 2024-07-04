import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { BillingService, Currency } from '@flaps/core';
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
  });
  unsubscribeAll = new Subject<void>();

  @Input() currency: Currency | undefined;
  @Output() budgetChange = new EventEmitter<{ value: number | null } | undefined>();

  constructor(private billing: BillingService) {
    this.billing
      .getSubscription()
      .pipe(
        filter((subscription) => !!subscription),
        map((subscription) => {
          const budget = subscription?.subscription?.on_demand_budget;
          return typeof budget === 'number' ? budget : null;
        }),
      )
      .subscribe((budget) => {
        const type = typeof budget === 'number' ? 'limited' : 'unlimited';
        this.form.controls.budget.setValue(budget);
        this.form.controls.type.setValue(type);
        this.updateValidation(type);
        this.budgetChange.emit({ value: budget });
      });

    this.form.valueChanges
      .pipe(
        startWith(this.form.getRawValue()),
        map((values) => {
          this.budgetChange.emit(
            this.form.valid ? { value: values.type === 'limited' ? (values.budget as number) : null } : undefined,
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
