import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SDKService } from '../api';
import { BackendConfigurationService } from '../config';
import { MagicAction } from '../models';

const AUTH = 'auth';
const MAGIC = 'magic';

@Injectable({
  providedIn: 'root',
})
export class TokenService {
  constructor(
    private sdk: SDKService,
    private config: BackendConfigurationService,
  ) {}

  validate(token: string): Observable<MagicAction> {
    const url = this.config.getAPIURL() + `/${AUTH}/${MAGIC}?token=${token}`;
    return this.sdk.nuclia.rest.post(url, {});
  }
}
