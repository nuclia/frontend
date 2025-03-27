import { Injectable } from '@angular/core';
import { SDKService } from '@flaps/core';
import { Observable, of } from 'rxjs';
import { AuthenticatedUser, User, UserSearch, UserSummary } from './user.models';

const USERS_ENDPOINT = '/manage/@users';
const USER_ENDPOINT = '/manage/@user';
const SEARCH_USERS_ENDPOINT = '/manage/@search_users';
export const SEARCH_USERS_ACCOUNT_ENDPOINT = '/manage/@search_users_account';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(private sdk: SDKService) {}

  getUsers(): Observable<UserSummary[]> {
    return this.sdk.nuclia.rest.get(`${USERS_ENDPOINT}`);
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

  createUser(user: { name: string; email: string }): Observable<User> {
    return this.sdk.nuclia.rest.post(`${USERS_ENDPOINT}`, user);
  }

  deleteUser(userId: string): Observable<void> {
    return this.sdk.nuclia.rest.delete(`${USER_ENDPOINT}/${userId}`);
  }

  getAuthenticatedUser(): Observable<AuthenticatedUser> {
    return this.sdk.nuclia.rest.get('/user');
  }
}
