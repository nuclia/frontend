import { Injectable } from '@angular/core';
import { BehaviorSubject, map, switchMap, take } from 'rxjs';
import { SDKService } from '@flaps/core';
import { NUAClientPayload } from '@nuclia/core';

@Injectable({ providedIn: 'root' })
export class AccountNUAService {
  private accountSlug = this.sdk.currentAccount.pipe(
    map((account) => account.slug),
    take(1),
  );

  private onUpdate = new BehaviorSubject<void>(undefined);

  clients = this.onUpdate.pipe(
    switchMap(() => this.accountSlug),
    switchMap((account) => this.sdk.nuclia.db.getNUAClients(account)),
  );

  constructor(private sdk: SDKService) {}

  updateClients() {
    this.onUpdate.next();
  }

  createClient(payload: NUAClientPayload) {
    return this.accountSlug.pipe(switchMap((account) => this.sdk.nuclia.db.createNUAClient(account, payload)));
  }

  renewClient(id: string) {
    return this.accountSlug.pipe(switchMap((account) => this.sdk.nuclia.db.renewNUAClient(account, id)));
  }

  deleteClient(id: string) {
    return this.accountSlug.pipe(switchMap((account) => this.sdk.nuclia.db.deleteNUAClient(account, id)));
  }
}
