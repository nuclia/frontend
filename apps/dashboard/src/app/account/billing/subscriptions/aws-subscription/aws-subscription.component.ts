import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BillingService } from '@flaps/core';
import { map } from 'rxjs';
import { SisToastService } from '@nuclia/sistema';

@Component({
  selector: 'app-aws-subscription',
  templateUrl: './aws-subscription.component.html',
  styleUrls: ['./aws-subscription.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AwsSubscriptionComponent {
  budget?: { value: number | null };
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
