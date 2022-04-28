import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { APIService } from '../api.service';
import { BackendConfigurationService } from '../backend-config.service';
import { MagicAction } from '../models/magic.model';


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
