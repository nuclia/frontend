import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CancellationFeedback, SubscriptionStatus } from '../account/billing/billing.models';
import { map, merge, of, switchMap, take, tap } from 'rxjs';
import { SisModalService, SisToastService } from '@nuclia/sistema';
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
    private modalService: SisModalService,
    private toaster: SisToastService,
    private billingService: BillingService,
    private stateService: StateService,
    private router: Router,
    private route: ActivatedRoute,
    private navigation: NavigationService,
    private cdr: ChangeDetectorRef,
  ) {}

  delete() {
    this.loading = true;
    this.route.queryParamMap
      .pipe(
        take(1),
        map((params) => params.get('account') || ''),
        switchMap((slug) => this.sdk.nuclia.db.getAccount(slug)),
        switchMap((account) =>
          this.sdk.nuclia.db.getWelcome().pipe(
            map((welcome) => welcome.accounts.length > 1),
            switchMap((canKeepUser) => {
              if (canKeepUser) {
                const confirm = this.modalService.openConfirm({
                  title: 'account.delete.keep_user_title',
                  confirmLabel: 'account.delete.keep_user',
                  cancelLabel: 'account.delete.delete_user',
                });
                return merge(
                  confirm.onDismiss.pipe(
                    tap(() => {
                      // Throw error if the user clicks outside the modal
                      // TODO: add dismissable input to confirmation modals ?
                      throw 'error';
                    }),
                  ),
                  confirm.onClose,
                ).pipe(take(1));
              } else {
                return of(false);
              }
            }),
            tap(() => {
              // Billing service only works if account is set
              this.stateService.setAccount(account);
            }),
            switchMap((keepUser) =>
              // TODO: in the future the cancel request won't be necessary because the backend will do it automatically on account delete
              this.billingService.getSubscription().pipe(
                map((subscription) => subscription?.status === SubscriptionStatus.ACTIVE),
                switchMap((cancelRequired) =>
                  cancelRequired
                    ? this.billingService.cancelSubscription({
                        feedback: this.feedback,
                        comment: this.comment || undefined,
                      })
                    : of(undefined),
                ),
                switchMap(() => this.sdk.nuclia.db.deleteAccount(account.slug)),
                switchMap(() => (keepUser ? of(undefined) : this.sdk.nuclia.auth.deleteAuthenticatedUser())),
                map(() => keepUser),
              ),
            ),
          ),
        ),
      )
      .subscribe({
        next: (keepUser) => {
          this.stateService.cleanAccount();
          if (keepUser) {
            this.router.navigate([this.navigation.getAccountSelectUrl()]);
          } else {
            const feedbackSent = this.feedback || this.comment.length > 0;
            this.router.navigate(['/farewell'], { queryParams: { feedback: feedbackSent ? 'true' : undefined } });
          }
        },
        error: () => {
          this.loading = false;
          this.cdr.markForCheck();
          this.toaster.error('account.delete.error');
        },
      });
  }
}
