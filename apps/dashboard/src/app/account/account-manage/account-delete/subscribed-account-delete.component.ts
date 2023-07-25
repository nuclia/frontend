import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { ModalRef } from '@guillotinaweb/pastanaga-angular';
import { SDKService, StateService } from '@flaps/core';
import { map, shareReplay, take } from 'rxjs';
import { BillingService } from '../../billing/billing.service';
import { SisModalService, SisToastService } from '@nuclia/sistema';
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
  isActiveSubscription = this.subscription.pipe(
    map((subscription) => subscription?.status === SubscriptionStatus.ACTIVE),
  );

  constructor(
    public modal: ModalRef,
    private sdk: SDKService,
    private stateService: StateService,
    private billingService: BillingService,
    private toaster: SisToastService,
    private modalService: SisModalService,
    private router: Router,
  ) {}

  confirm() {
    this.deleteImmediately === 'yes' ? this.feedback() : this.cancel();
  }

  feedback() {
    this.sdk.currentAccount.pipe(take(1)).subscribe((account) => {
      this.modal.close();
      this.router.navigate(['/feedback'], { queryParams: { account: account.slug } });
    });
  }

  cancel() {
    this.billingService.cancelSubscription({}).subscribe(() => {
      this.toaster.success('account.delete.deletion_scheduled');
      this.modal.close();
    });
  }
}
