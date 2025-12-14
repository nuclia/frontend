import { inject, Injectable } from '@angular/core';
import { SDKService } from './sdk.service';
import { catchError, map, Observable, of } from 'rxjs';
import { BedrockParameters, BedrockPayload, BedrockStatus } from '../models/bedrock.model';

@Injectable({ providedIn: 'root' })
export class BedrockService {
  sdk = inject(SDKService);

  startAuthFlow(accountId: string, zone: string) {
    return this.sdk.nuclia.rest.get<BedrockParameters>(
      `/account/${accountId}/assume_role/bedrock`,
      undefined,
      undefined,
      zone,
    );
  }

  finishAuthFlow(accountId: string, zone: string, data: BedrockPayload) {
    return this.sdk.nuclia.rest.post<void>(
      `/account/${accountId}/assume_role/bedrock`,
      data,
      undefined,
      undefined,
      false,
      zone,
    );
  }

  delete(accountId: string, zone: string) {
    return this.sdk.nuclia.rest.delete(`/account/${accountId}/assume_role/bedrock`, undefined, undefined, zone);
  }

  getStatus(accountId: string, zone: string): Observable<BedrockStatus> {
    return this.sdk.nuclia.rest
      .get(`/account/${accountId}/assume_role/bedrock/validate`, undefined, undefined, zone)
      .pipe(
        map(() => ({ status: 'active' }) as BedrockStatus),
        catchError((error) => {
          const status =
            error?.body?.detail === 'Assume role process not started for this account'
              ? 'none'
              : error?.body?.detail === 'Assume role configuration is incomplete for this account'
                ? 'incomplete'
                : 'error';
          return of({
            status,
            errorMessage: status === 'error' ? error?.body?.detail?.message : undefined,
          } as BedrockStatus);
        }),
      );
  }
}
