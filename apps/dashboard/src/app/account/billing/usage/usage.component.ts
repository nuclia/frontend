import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { shareReplay } from 'rxjs';
import { AccountBudget, BillingService } from '@flaps/core';
import { SisToastService } from '@nuclia/sistema';

@Component({
  selector: 'app-usage',
  templateUrl: './usage.component.html',
  styleUrls: ['./usage.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class UsageComponent {
  usage = this.billing.getAccountUsage().pipe(shareReplay());
  budget?: Partial<AccountBudget>;

  constructor(
    private billing: BillingService,
    private toaster: SisToastService,
    private cdr: ChangeDetectorRef,
  ) {}

  modifyBudget() {
    if (!this.budget) {
      return;
    }
    this.billing.saveBudget(this.budget).subscribe({
      next: ({ budgetBelowTotal }) => {
        this.budget = undefined;
        this.cdr.markForCheck();
        if (budgetBelowTotal) {
          this.toaster.warning('billing.budget-warning');
        } else {
          this.toaster.success('billing.budget-modified');
        }
      },
      error: () => {
        this.toaster.error('generic.error.oops');
      },
    });
  }
}
