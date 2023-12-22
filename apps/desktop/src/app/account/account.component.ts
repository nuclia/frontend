import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { SyncService } from '@nuclia/sync';
import { SDKService } from '@flaps/core';
import { catchError, of, tap } from 'rxjs';

@Component({
  selector: 'nde-select-account',
  templateUrl: 'account.component.html',
  styleUrls: ['account.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectAccountComponent {
  accounts = this.sdk.nuclia.db.getAccounts().pipe(
    tap((accounts) => {
      if (accounts.length === 0) {
        this.logout();
      }
    }),
    catchError(() => {
      this.logout();
      return of([]);
    }),
  );

  constructor(
    private sdk: SDKService,
    private sync: SyncService,
    private router: Router,
  ) {}

  selectAccount(account: string, accountId: string) {
    this.sync.selectAccount(account, accountId);
    this.router.navigate(['/']);
  }

  logout() {
    this.sync.cleanUpAccount();
    this.sdk.nuclia.auth.logout();
    this.router.navigate(['/']);
  }
}
