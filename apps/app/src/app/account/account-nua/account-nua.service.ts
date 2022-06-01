import { Injectable } from '@angular/core';
import { BehaviorSubject, map, filter, take, switchMap } from 'rxjs';
import { SDKService, StateService } from '@flaps/auth';
import { NUAClientPayload } from '@nuclia/core';

@Injectable({providedIn: 'root'})
export class AccountNUAService {

  private accountSlug = this.stateService.account.pipe(
    filter((account) => !!account),
    map((account) => account!.slug),
    take(1)
  );

  private onUpdate = new BehaviorSubject<void>(undefined);

  clients = this.onUpdate.pipe(
    switchMap(() => this.accountSlug),
    switchMap((account) => this.sdk.nuclia.db.getNUAClients(account))
  )

  updateClients() {
    this.onUpdate.next();
  }

  createClient(payload: NUAClientPayload) {
    return this.accountSlug.pipe(
      switchMap((account) => this.sdk.nuclia.db.createNUAClient(account, payload))
    );
  }

  renewClient(id: string) {
    return this.accountSlug.pipe(
      switchMap((account) => this.sdk.nuclia.db.renewNUAClient(account, id))
    );
  }

  deleteClient(id: string) {
    return this.accountSlug.pipe(
      switchMap((account) => this.sdk.nuclia.db.deleteNUAClient(account, id))
    );
  }

  constructor(private sdk: SDKService, private stateService: StateService) {}
}
