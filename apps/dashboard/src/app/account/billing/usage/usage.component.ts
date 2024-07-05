import { ChangeDetectionStrategy, Component } from '@angular/core';
import { shareReplay } from 'rxjs';
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
  budget?: { value: number | null };

  constructor(
    private billing: BillingService,
    private toaster: SisToastService,
  ) {}

  modifyBudget() {
    this.billing.saveBudget(this.budget?.value || null).subscribe({
      next: ({ budgetBelowTotal }) => {
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
