import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { shareReplay, switchMap, take } from 'rxjs';
import { BillingService } from '@flaps/core';
import { SisToastService } from '@nuclia/sistema';

@Component({
  selector: 'app-usage',
  templateUrl: './usage.component.html',
  styleUrls: ['./usage.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsageComponent {
  usage = this.billing.getAccountUsage().pipe(shareReplay());
  budget = new FormControl<string>('0', { nonNullable: true, validators: [Validators.required, Validators.min(0)] });

  constructor(
    private billing: BillingService,
    private cdr: ChangeDetectorRef,
    private toaster: SisToastService,
  ) {
    this.usage.pipe(take(1)).subscribe((usage) => {
      this.budget.setValue(usage.budget.toString());
    });
  }

  saveBudget() {
    this.billing
      .modifySubscription({ on_demand_budget: parseInt(this.budget.value) })
      .pipe(switchMap(() => this.billing.getAccountUsage()))
      .subscribe((usage) => {
        this.budget.setValue(usage.budget.toString());
        this.budget.markAsPristine();
        if (usage.budget < Object.values(usage.invoice_items).reduce((acc, curr) => acc + curr.over_cost, 0)) {
          this.toaster.warning('billing.budget_warning');
        }
        this.cdr?.markForCheck();
      });
  }
}
