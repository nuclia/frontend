import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { SyncService } from '../sync/sync.service';
import { SDKService } from '@flaps/core';

@Component({
  selector: 'nde-select-account',
  templateUrl: 'account.component.html',
  styleUrls: ['account.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectAccountComponent {
  accounts = this.sdk.nuclia.db.getAccounts();
  constructor(private sdk: SDKService, private sync: SyncService, private router: Router) {}

  selectAccount(account: string) {
    this.sync.selectAccount(account);
    this.router.navigate(['/']);
  }
}
