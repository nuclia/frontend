import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { AccountBudget, BillingService } from '@flaps/core';
import { SisToastService } from '@nuclia/sistema';
import { shareReplay } from 'rxjs';

@Component({
  selector: 'app-manual-subscription',
  templateUrl: './manual-subscription.component.html',
  styleUrls: ['./manual-subscription.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ManualSubscriptionComponent {
  usage = this.billing.getManualAccountUsage().pipe(shareReplay(1));
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
      next: () => {
        this.budget = undefined;
        this.cdr.markForCheck();
        this.toaster.success('billing.budget-modified');
      },
      error: () => {
        this.toaster.error('generic.error.oops');
      },
    });
  }
}
