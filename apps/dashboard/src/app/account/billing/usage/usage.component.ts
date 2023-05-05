import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { shareReplay, switchMap, take } from 'rxjs';
import { BillingService } from '../billing.service';

@Component({
  selector: 'app-usage',
  templateUrl: './usage.component.html',
  styleUrls: ['./usage.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsageComponent {
  usage = this.billing.getAccountUsage().pipe(shareReplay());
  budget = new FormControl<string>('0', { nonNullable: true, validators: [Validators.required, Validators.min(0)] });

  constructor(private billing: BillingService, private cdr: ChangeDetectorRef) {
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
        this.cdr?.markForCheck();
      });
  }
}
