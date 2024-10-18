import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { AccountBudget, BillingService } from '@flaps/core';
import { map } from 'rxjs';
import { SisToastService } from '@nuclia/sistema';

@Component({
  selector: 'app-aws-subscription',
  templateUrl: './aws-subscription.component.html',
  styleUrls: ['./aws-subscription.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AwsSubscriptionComponent {
  budget?: Partial<AccountBudget>;
  awsUrl = this.billing
    .getAwsSubscription()
    .pipe(
      map(
        (subscription) =>
          `https://console.aws.amazon.com/marketplace/home#/subscriptions/${subscription?.aws_product_code || ''}`,
      ),
    );

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
