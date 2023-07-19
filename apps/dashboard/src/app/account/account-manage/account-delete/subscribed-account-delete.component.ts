import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { ModalRef } from '@guillotinaweb/pastanaga-angular';
import { SDKService, StateService } from '@flaps/core';
import { map, merge, of, shareReplay, switchMap, take } from 'rxjs';
import { BillingService } from '../../billing/billing.service';
import { SisModalService, SisToastService } from '@nuclia/sistema';
import { NavigationService } from '@flaps/common';
import { SubscriptionStatus } from '../../billing/billing.models';

@Component({
  selector: 'app-subscribed-account-delete',
  templateUrl: './subscribed-account-delete.component.html',
  styleUrls: ['./subscribed-account-delete.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubscribedAccountDeleteComponent {
  loading = false;
  deleteImmediately?: 'yes' | 'no';
  subscription = this.billingService.getSubscription().pipe(shareReplay());

  constructor(
    public modal: ModalRef,
    private sdk: SDKService,
    private stateService: StateService,
    private billingService: BillingService,
    private toaster: SisToastService,
    private modalService: SisModalService,
    private router: Router,
    private navigation: NavigationService,
  ) {}

  confirm() {
    this.deleteImmediately === 'yes' ? this.delete() : this.cancel();
  }

  delete() {
    this.loading = true;
    this.sdk.currentAccount
      .pipe(
        take(1),
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
                  confirm.onDismiss.pipe(map(() => true)), // Keep the profile if the user clicks outside the modal
                  confirm.onClose,
                ).pipe(take(1));
              } else {
                return of(false);
              }
            }),
            switchMap((keepUser) =>
              // TODO: in the future the cancel request won't be necessary because the backend will do it automatically on account delete
              this.subscription.pipe(
                map((subscription) => subscription?.status === SubscriptionStatus.ACTIVE),
                switchMap((cancelRequired) =>
                  cancelRequired ? this.billingService.cancelSubscription({}) : of(undefined),
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
          this.modal.close();
          this.stateService.cleanAccount();
          if (keepUser) {
            this.router.navigate([this.navigation.getAccountSelectUrl()]);
          } else {
            this.router.navigate(['/setup/farewell']);
          }
        },
        error: () => {
          this.loading = false;
          this.toaster.error('account.delete.error');
        },
      });
  }

  cancel() {
    this.billingService.cancelSubscription({}).subscribe(() => {
      this.toaster.success('account.delete.deletion_scheduled');
      this.modal.close();
    });
  }
}
