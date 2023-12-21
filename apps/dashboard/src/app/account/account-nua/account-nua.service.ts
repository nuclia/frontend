import { Injectable } from '@angular/core';
import { BehaviorSubject, map, shareReplay, switchMap, take } from 'rxjs';
import { SDKService } from '@flaps/core';
import { NUAClientPayload } from '@nuclia/core';

@Injectable({ providedIn: 'root' })
export class AccountNUAService {
  private account = this.sdk.currentAccount;
  private zones = this.sdk.nuclia.rest.getZones().pipe(take(1), shareReplay());

  private onUpdate = new BehaviorSubject<void>(undefined);

  clients = this.onUpdate.pipe(
    switchMap(() => this.account),
    switchMap((account) => this.sdk.nuclia.db.getNUAClients(account.id)),
    map((nuaClients) =>
      nuaClients.map((nuaClient) => ({
        ...nuaClient,
        zone: nuaClient.zone,
      })),
    ),
  );

  constructor(private sdk: SDKService) {}

  updateClients() {
    this.onUpdate.next();
  }

  createClient(payload: NUAClientPayload, zoneId: string) {
    return this.account.pipe(
      switchMap((account) =>
        this.zones.pipe(
          switchMap((zones) => this.sdk.nuclia.db.createNUAClient(account.id, payload, zones[zoneId])),
        ),
      ),
    );
  }

  renewClient(id: string, zone: string) {
    return this.account.pipe(switchMap((account) => this.sdk.nuclia.db.renewNUAClient(account.id, id, zone)));
  }

  deleteClient(id: string, zone: string) {
    return this.account.pipe(switchMap((account) => this.sdk.nuclia.db.deleteNUAClient(account.id, id, zone)));
  }
}
