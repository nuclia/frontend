import { Injectable } from '@angular/core';
import { BehaviorSubject, shareReplay, switchMap, take } from 'rxjs';
import { SDKService } from '@flaps/core';
import { NUAClientPayload } from '@nuclia/core';

@Injectable({ providedIn: 'root' })
export class AccountNUAService {
  private account = this.sdk.currentAccount.pipe(take(1));
  private zones = this.sdk.nuclia.rest.getZones().pipe(take(1), shareReplay());

  private onUpdate = new BehaviorSubject<void>(undefined);

  clients = this.onUpdate.pipe(
    switchMap(() => this.account),
    switchMap((account) =>
      this.sdk.useRegionalSystem
        ? this.sdk.nuclia.db.getNUAClients(account.id)
        : this.sdk.nuclia.db.getNUAClients(account.slug),
    ),
  );

  constructor(private sdk: SDKService) {}

  updateClients() {
    this.onUpdate.next();
  }

  createClient(payload: NUAClientPayload, zoneId: string) {
    return this.account.pipe(
      switchMap((account) =>
        this.sdk.useRegionalSystem
          ? this.zones.pipe(
              switchMap((zones) => {
                const zone = zones[zoneId];
                return this.sdk.nuclia.db.createNUAClient(account.id, payload, zone);
              }),
            )
          : this.sdk.nuclia.db.createNUAClient(account.slug, payload),
      ),
    );
  }

  renewClient(id: string, zoneId: string) {
    return this.account.pipe(
      switchMap((account) =>
        this.sdk.useRegionalSystem
          ? this.zones.pipe(
              switchMap((zones) => {
                const zone = zones[zoneId];
                return this.sdk.nuclia.db.renewNUAClient(account.id, id, zone);
              }),
            )
          : this.sdk.nuclia.db.renewNUAClient(account.slug, id),
      ),
    );
  }

  deleteClient(id: string, zoneId: string) {
    return this.account.pipe(
      switchMap((account) =>
        this.sdk.useRegionalSystem
          ? this.zones.pipe(
              switchMap((zones) => {
                const zone = zones[zoneId];
                return this.sdk.nuclia.db.deleteNUAClient(account.id, id, zone);
              }),
            )
          : this.sdk.nuclia.db.deleteNUAClient(account.slug, id),
      ),
    );
  }
}
