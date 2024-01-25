import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SDKService } from '../api';
import { MagicAction } from '../models';

@Injectable({
  providedIn: 'root',
})
export class TokenService {
  constructor(private sdk: SDKService) {}

  validate(token: string, zone?: string): Observable<MagicAction> {
    return this.sdk.nuclia.rest.post(`/auth/magic?token=${token}`, undefined, undefined, undefined, undefined, zone);
  }
}
