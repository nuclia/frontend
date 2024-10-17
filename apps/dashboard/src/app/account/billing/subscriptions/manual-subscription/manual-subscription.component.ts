import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BillingService } from '@flaps/core';
import { SisToastService } from '@nuclia/sistema';
import { shareReplay } from 'rxjs';

@Component({
  selector: 'app-manual-subscription',
  templateUrl: './manual-subscription.component.html',
  styleUrls: ['./manual-subscription.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManualSubscriptionComponent {
  usage = this.billing.getManualAccountUsage().pipe(shareReplay(1));
  budget?: { value: number | null };

  constructor(
    private billing: BillingService,
    private toaster: SisToastService,
  ) {}

  modifyBudget() {
    this.billing.saveBudget(this.budget?.value || null).subscribe({
      next: () => {
        this.toaster.success('billing.budget-modified');
      },
      error: () => {
        this.toaster.error('generic.error.oops');
      },
    });
  }
}
