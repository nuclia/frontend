import { Injectable } from '@angular/core';
import { SDKService } from '@flaps/core';
import { Observable, of } from 'rxjs';
import { AuthenticatedUser, User, UserFilters, UserSearch, UserSummary } from './user.models';
import { AccountRoles, UserType } from '@nuclia/core';

const USERS_ENDPOINT = '/manage/@users';
const USER_ENDPOINT = '/manage/@user';
const SEARCH_USERS_ENDPOINT = '/manage/@search_users';
export const SEARCH_USERS_ACCOUNT_ENDPOINT = '/manage/@search_users_account';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(private sdk: SDKService) {}

  getUsers(accountRole?: AccountRoles, filters: UserFilters = {}): Observable<UserSummary[]> {
    const params = new URLSearchParams();
    if (accountRole) {
      params.set('account_role', accountRole);
    }
    filters.accountTypes?.forEach((type) => params.append('account_types', type));
    filters.excludedAccountTypes?.forEach((type) => params.append('excluded_account_types', type));
    if (filters.includeAccounts) {
      params.set('include_accounts', 'true');
    }
    const query = params.toString();
    return this.sdk.nuclia.rest.get(`${USERS_ENDPOINT}${query ? `?${query}` : ''}`);
  }

  getUser(userId: string): Observable<User> {
    return this.sdk.nuclia.rest.get(`${USER_ENDPOINT}/${userId}`);
  }

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

  createUser(user: { name: string; email: string; type: UserType }): Observable<User> {
    return this.sdk.nuclia.rest.post(`${USERS_ENDPOINT}`, user);
  }

  modifyUser(userId: string, user: Partial<User>): Observable<User> {
    return this.sdk.nuclia.rest.patch(`${USER_ENDPOINT}/${userId}`, user);
  }

  deleteUser(userId: string): Observable<void> {
    return this.sdk.nuclia.rest.delete(`${USER_ENDPOINT}/${userId}`);
  }

  getAuthenticatedUser(): Observable<AuthenticatedUser> {
    return this.sdk.nuclia.rest.get('/user');
  }
}
