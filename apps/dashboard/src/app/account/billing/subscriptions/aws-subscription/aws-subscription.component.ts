import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BillingService } from '@flaps/core';
import { map } from 'rxjs';

@Component({
  selector: 'app-aws-subscription',
  templateUrl: './aws-subscription.component.html',
  styleUrls: ['./aws-subscription.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AwsSubscriptionComponent {
  awsUrl = this.billing
    .getAwsSubscription()
    .pipe(
      map(
        (subscription) =>
          `https://console.aws.amazon.com/marketplace/home#/subscriptions/${subscription?.aws_product_code || ''}`,
      ),
    );

  constructor(private billing: BillingService) {}
}
