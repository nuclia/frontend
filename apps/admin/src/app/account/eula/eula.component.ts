import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SDKService } from '@flaps/core';
import { SisModalService } from '@nuclia/sistema';
import { EulaModalComponent } from 'libs/common/src/lib/onboarding/eula-modal/eula-modal.component';
import { forkJoin, switchMap } from 'rxjs';

@Component({
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EulaComponent {
  private sdk = inject(SDKService);
  private route = inject(ActivatedRoute);
  private modalService = inject(SisModalService);
  private router = inject(Router);

  constructor() {
    this.sdk.nuclia.db
      .getAccounts()
      .pipe(switchMap((accounts) => forkJoin(accounts.map((account) => this.sdk.nuclia.db.getAccount(account.slug)))))
      .subscribe((accounts) => {
        const account = accounts.find((account) => !account?.eula_accepted && account?.can_manage_account);
        if (account) {
          this.modalService
            .openModal(EulaModalComponent, { data: { accountSlug: account.slug }, dismissable: false })
            .onClose.subscribe(() => {
              this.redirect();
            });
        } else {
          this.redirect();
        }
      });
  }

  redirect() {
    const app = this.route.snapshot.queryParams['redirect_after_eula'];
    if (['platform', 'rag'].includes(app)) {
      location.href = this.sdk.getOriginForApp(app);
    } else {
      console.error('Invalid redirect');
      this.router.navigate(['/']);
    }
  }
}
