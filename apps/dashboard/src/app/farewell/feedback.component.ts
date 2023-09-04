import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CancellationFeedback } from '../account/billing/billing.models';
import { map, switchMap, take } from 'rxjs';
import { SisToastService } from '@nuclia/sistema';
import { SDKService, StateService } from '@flaps/core';
import { BillingService } from '../account/billing/billing.service';
import { NavigationService } from '@flaps/common';

@Component({
  selector: 'app-feedback',
  templateUrl: './feedback.component.html',
  styleUrls: ['./feedback.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeedbackComponent {
  feedback?: CancellationFeedback;
  comment: string = '';
  loading = false;

  constructor(
    private sdk: SDKService,
    private toaster: SisToastService,
    private billingService: BillingService,
    private stateService: StateService,
    private router: Router,
    private route: ActivatedRoute,
    private navigation: NavigationService,
    private cdr: ChangeDetectorRef,
  ) {}

  cancelSubscription() {
    this.loading = true;
    this.route.queryParamMap
      .pipe(
        take(1),
        map((params) => params.get('account') || ''),
        switchMap((slug) => this.sdk.nuclia.db.getAccount(slug)),
        switchMap((account) => {
          this.stateService.setAccount(account); // Billing service only works if account is set
          return this.billingService
            .cancelSubscription({
              feedback: this.feedback,
              comment: this.comment || undefined,
            })
            .pipe(map(() => account));
        }),
      )
      .subscribe({
        next: (account) => {
          this.router.navigate([`${this.navigation.getBillingUrl(account.slug)}/my-subscription`]);
          this.toaster.success('billing.subscription-ended');
        },
        error: () => {
          this.loading = false;
          this.cdr.markForCheck();
          this.toaster.error('billing.unsubscribe-error');
        },
      });
  }
}
