import { APIService } from '@flaps/core';
import { Injectable } from '@angular/core';
import { User, UserSummary, UserSearch, UserPatch, UserCreation, UserCreated } from '../models/user.model';
import { Observable, of } from 'rxjs';

const STF_USER = '/manage/@user';
const STF_USERS = '/manage/@users';
const STF_SEARCHUSERS = '/manage/@search_users';
const STF_SEARCHUSERSACCOUNT = '/manage/@search_users_account';
const STF_SEARCHUSERSSTASH = '/manage/@search_users_stash';
const STF_RESET = '@reset';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  constructor(private api: APIService) {}

  getUser(userId: string): Observable<User> {
    return this.api.get(STF_USER + '/' + userId, true, undefined, true);
  }

  getUsers(): Observable<UserSummary[]> {
    return this.api.get(STF_USERS, true, undefined, true);
  }

  searchUser(term: string): Observable<UserSearch[]> {
    if (term === '') {
      return of([]);
    }
    return this.api.get(STF_SEARCHUSERS + '/' + term, true, undefined, true);
  }

  edit(userId: string, user: UserPatch) {
    return this.api.patch(STF_USER + '/' + userId, user, true, undefined, true);
  }

  create(user: UserCreation): Observable<UserCreated> {
    return this.api.post(STF_USERS, user, true, undefined, undefined, true);
  }

  deleteUser(userId: string) {
    return this.api.delete(STF_USER + '/' + userId, true, true);
  }

  reset(userId: string) {
    return this.api.post(STF_USER + '/' + userId + '/' + STF_RESET, {}, true, undefined, undefined, true);
  }

  searchAccountUser(accountId: string, term: string): Observable<UserSearch[]> {
    if (term === '') {
      return of([]);
    }
    return this.api.get(STF_SEARCHUSERSACCOUNT + '/' + accountId + '/' + term, true, undefined, true);
  }

  searchStashUser(accountId: string, stash_id: string, term: string): Observable<UserSearch[]> {
    if (term === '') {
      return of([]);
    }
    return this.api.get(STF_SEARCHUSERSSTASH + '/' + term, true, undefined, true);
  }
}
