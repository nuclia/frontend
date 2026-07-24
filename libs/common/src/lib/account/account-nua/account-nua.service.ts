import { Injectable } from '@angular/core';
import { BehaviorSubject, switchMap, take } from 'rxjs';
import { SDKService } from '@flaps/core';
import { NUAClientEditPayload, NUAClientPayload } from '@nuclia/core';

@Injectable({ providedIn: 'root' })
export class AccountNUAService {
  private account = this.sdk.currentAccount;

  private onUpdate = new BehaviorSubject<void>(undefined);

  clients = this.onUpdate.pipe(
    switchMap(() => this.account),
    switchMap((account) => this.sdk.nuclia.db.getNUAClients(account.id)),
  );

  constructor(private sdk: SDKService) {}

  updateClients() {
    this.onUpdate.next();
  }

  createClient(payload: NUAClientPayload, zone: string) {
    return this.account.pipe(
      take(1),
      switchMap((account) => this.sdk.nuclia.db.createNUAClient(account.id, payload, zone)),
    );
  }

  editClient(internalId: string, payload: NUAClientEditPayload, zone: string) {
    return this.account.pipe(
      take(1),
      switchMap((account) => this.sdk.nuclia.db.editNUAClient(account.id, internalId, payload, zone)),
    );
  }

  renewClient(id: string, zone: string) {
    return this.account.pipe(
      take(1),
      switchMap((account) => this.sdk.nuclia.db.renewNUAClient(account.id, id, zone)),
    );
  }

  deleteClient(id: string, zone: string) {
    return this.account.pipe(
      take(1),
      switchMap((account) => this.sdk.nuclia.db.deleteNUAClient(account.id, id, zone)),
    );
  }
}
