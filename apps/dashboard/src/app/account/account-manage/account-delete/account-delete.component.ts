import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { ModalRef } from '@guillotinaweb/pastanaga-angular';
import { SDKService, STFTrackingService } from '@flaps/core';
import { map, of, shareReplay, switchMap, take } from 'rxjs';
import { SisToastService } from '@nuclia/sistema';
import { NavigationService } from '@flaps/common';

@Component({
  selector: 'app-account-delete',
  templateUrl: './account-delete.component.html',
  styleUrls: ['./account-delete.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountDeleteComponent {
  loading = false;
  deleteAccount = false;
  keepUser?: 'yes' | 'no';
  account = this.sdk.currentAccount;
  canKeepUser = this.sdk.nuclia.db.getWelcome().pipe(
    map((welcome) => welcome.accounts.length > 1),
    shareReplay(),
  );

  constructor(
    public modal: ModalRef,
    private sdk: SDKService,
    private toaster: SisToastService,
    private router: Router,
    private navigation: NavigationService,
    private tracking: STFTrackingService,
  ) {}

  delete() {
    this.loading = true;
    const keepUser = this.keepUser === 'yes';
    this.account
      .pipe(
        take(1),
        switchMap((account) => {
          this.tracking.logEvent(`delete account`, {
            accountId: account.id,
            accountSlug: account.slug,
            accountTitle: account.title,
          });
          return this.sdk.nuclia.db.deleteAccount(account.slug);
        }),
        switchMap(() => (keepUser ? of(undefined) : this.sdk.nuclia.auth.deleteAuthenticatedUser())),
      )
      .subscribe({
        next: () => {
          this.sdk.cleanAccount();
          if (keepUser) {
            this.router.navigate([this.navigation.getAccountSelectUrl()]);
          } else {
            this.router.navigate(['/farewell']);
          }
          this.modal.close();
        },
        error: () => {
          this.toaster.error('account.delete.error');
          this.loading = false;
        },
      });
  }
}
