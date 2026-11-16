import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { AccountTypes } from '@nuclia/core';
import { AccountTypeDefaults } from '../models';
import { SDKService } from './sdk.service';
import { ZoneService } from './zone.service';

@Injectable({
  providedIn: 'root',
})
export class AccountService {
  private sdk = inject(SDKService);
  private zoneService = inject(ZoneService);

  isRagAccount = this.zoneService
    .getZones()
    .pipe(
      map((zones) =>
        zones.some((zone) => zone.components?.some((component) => component.name === 'rag' && component.available)),
      ),
    );

  getAccountTypes(): Observable<{ [key in AccountTypes]: AccountTypeDefaults }> {
    return this.sdk.nuclia.rest
      .get<{ [key in AccountTypes]: AccountTypeDefaults }>(`/configuration/account_types`)
      .pipe(catchError(() => of({} as { [key in AccountTypes]: AccountTypeDefaults })));
  }
}
