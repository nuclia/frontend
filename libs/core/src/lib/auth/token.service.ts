import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { APIService } from '../api';
import { BackendConfigurationService } from '../config';
import { MagicAction } from '../models';

const AUTH = 'auth';
const MAGIC = 'magic';

@Injectable({
  providedIn: 'root',
})
export class TokenService {
  constructor(private api: APIService, private config: BackendConfigurationService) {}

  validate(token: string): Observable<MagicAction> {
    const url = this.config.getAPIURL() + `/${AUTH}/${MAGIC}?token=${token}`;
    return this.api.post(url, {}, false, undefined);
  }
}
