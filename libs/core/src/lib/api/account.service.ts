import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AccountTypes } from '@nuclia/core';
import { AccountTypeDefaults } from '../models';
import { SDKService } from './sdk.service';

@Injectable({
  providedIn: 'root',
})
export class AccountService {
  constructor(private sdk: SDKService) {}

  getAccountTypes(): Observable<{ [key in AccountTypes]: AccountTypeDefaults }> {
    return this.sdk.nuclia.rest.get<{ [key in AccountTypes]: AccountTypeDefaults }>(`/configuration/account_types`);
  }
}
