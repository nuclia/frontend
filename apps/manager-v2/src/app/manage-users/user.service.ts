import { Injectable } from '@angular/core';
import { SDKService } from '@flaps/core';
import { Observable, of } from 'rxjs';
import { UserSearch } from './user.models';

const USERS_ENDPOINT = '/manage/@users';
const USER_ENDPOINT = '/manage/@user';
const SEARCH_USERS_ENDPOINT = '/manage/@search_users';
const SEARCH_USERS_ACCOUNT_ENDPOINT = '/manage/@search_users_account';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(private sdk: SDKService) {}

  searchUser(term: string): Observable<UserSearch[]> {
    if (!term) {
      return of([]);
    }
    return this.sdk.nuclia.rest.get(`${SEARCH_USERS_ENDPOINT}/${term}`);
  }

  searchAccountUser(accountId: string, term: string): Observable<UserSearch[]> {
    if (!term) {
      return of([]);
    }
    return this.sdk.nuclia.rest.get(`${SEARCH_USERS_ACCOUNT_ENDPOINT}/${accountId}/${term}`);
  }
}
