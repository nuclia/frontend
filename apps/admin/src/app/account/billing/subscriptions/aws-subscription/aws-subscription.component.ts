import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { BudgetComponent } from '@flaps/common';
import { AccountBudget, BillingService } from '@flaps/core';
import { PaButtonModule } from '@guillotinaweb/pastanaga-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { SisToastService } from '@nuclia/sistema';
import { map } from 'rxjs';

@Component({
  selector: 'app-aws-subscription',
  templateUrl: './aws-subscription.component.html',
  styleUrls: ['./aws-subscription.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BudgetComponent, PaButtonModule, AsyncPipe, TranslatePipe],
})
export class AwsSubscriptionComponent {
  budget?: Partial<AccountBudget>;
  awsUrl = this.billing.getAwsSubscription().pipe(
    map((subscription) => {
      const productId = subscription?.aws_product_id || subscription?.aws_product_code;
      return `https://console.aws.amazon.com/marketplace/home#/subscriptions/${productId || ''}`;
    }),
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
