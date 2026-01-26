import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { AccountBudget, BillingService, Currency } from '@flaps/core';
import { filter, map, startWith, Subject, takeUntil } from 'rxjs';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';

const DEFAULT_BUDGET = 500;

@Component({
  selector: 'app-budget',
  imports: [PaTextFieldModule, PaTogglesModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './budget.component.html',
  styleUrls: ['./budget.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BudgetComponent implements OnDestroy, OnInit {
  form = new FormGroup({
    budget: new FormControl<number | null>(null, { validators: [Validators.required, Validators.min(1)] }),
    action: new FormControl<'BLOCK_ACCOUNT' | 'WARN_ACCOUNT_OWNER'>('WARN_ACCOUNT_OWNER', {
      validators: [Validators.required],
    }),
  });
  unsubscribeAll = new Subject<void>();

  @Input() currency: Currency | undefined;
  @Input() showActions: boolean = true;
  @Input() defaultBudget = false;
  @Output() budgetChange = new EventEmitter<Partial<AccountBudget> | undefined>();

  constructor(private billing: BillingService) {}

  ngOnInit() {
    if (this.defaultBudget) {
      this.form.controls.budget.patchValue(DEFAULT_BUDGET);
    } else {
      this.billing
        .getSubscription()
        .pipe(filter((subscription) => !!subscription))
        .subscribe((subscription) => {
          const budget = subscription?.subscription?.on_demand_budget;
          this.form.patchValue({
            budget: typeof budget === 'number' ? budget : null,
            action: subscription?.subscription?.action_on_budget_exhausted || 'BLOCK_ACCOUNT',
          });
        });
    }

    this.form.valueChanges
      .pipe(
        startWith(this.form.getRawValue()),
        map((values) => {
          this.budgetChange.emit(
            this.form.valid
              ? {
                  on_demand_budget: values.budget as number,
                  action_on_budget_exhausted: this.showActions ? values.action : undefined,
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
}
