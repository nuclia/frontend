import { Injectable } from '@angular/core';
import { SDKService } from '@flaps/core';
import { Observable } from 'rxjs';
import { AccountCreationPayload, AccountPatchPayload, AccountSummary, ExtendedAccount } from './account.models';

const MANAGE_ACCOUNTS_ENDPOINT = '/manage/@accounts';
const MANAGE_ACCOUNT_ENDPOINT = '/manage/@account';

@Injectable({
  providedIn: 'root',
})
export class AccountService {
  constructor(private sdk: SDKService) {}

  getAccounts(): Observable<AccountSummary[]> {
    return this.sdk.nuclia.rest.get<AccountSummary[]>(MANAGE_ACCOUNTS_ENDPOINT);
  }

  getAccount(id: string): Observable<ExtendedAccount> {
    return this.sdk.nuclia.rest.get<ExtendedAccount>(`${MANAGE_ACCOUNT_ENDPOINT}/${id}`);
  }

  createAccount(account: AccountCreationPayload): Observable<unknown> {
    return this.sdk.nuclia.rest.post(MANAGE_ACCOUNTS_ENDPOINT, account);
  }

  updateAccount(id: string, data: AccountPatchPayload): Observable<void> {
    return this.sdk.nuclia.rest.patch(`${MANAGE_ACCOUNT_ENDPOINT}/${id}`, data);
  }

  deleteAccount(id: string): Observable<void> {
    return this.sdk.nuclia.rest.delete(`${MANAGE_ACCOUNT_ENDPOINT}/${id}`);
  }
}
