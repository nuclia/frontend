import { Injectable } from '@angular/core';
import { DeprecatedApiService } from './deprecated-api.service';
import { AccountUser, SetUsersAccount, InviteAccountData, KbUser, InviteKbData, SetUsersKb, User } from '../models';
import { Observable } from 'rxjs';

const VERSION = 'v1';
const ACCOUNT = 'account';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  constructor(private api: DeprecatedApiService) {}

  getAccountUser(slug: string, id: string): Observable<Partial<User>> {
    return this.api.get(`/${VERSION}/${ACCOUNT}/${slug}/user/${id}`, true, undefined, true);
  }

  getAccountUsers(slug: string): Observable<AccountUser[]> {
    return this.api.get(`/${VERSION}/${ACCOUNT}/${slug}/users`, true, undefined, true);
  }

  setAccountUsers(slug: string, users: SetUsersAccount): Observable<void> {
    const url = `/${VERSION}/${ACCOUNT}/${slug}/users`;
    return this.api.patch(url, JSON.stringify(users), true, undefined, true);
  }

  searchAccountUsers(slug: string, query: string): Observable<AccountUser[]> {
    const url = `/${VERSION}/${ACCOUNT}/${slug}/users/search?query=${query}`;
    return this.api.get(url, true, undefined, true);
  }

  getKbUsers(accountSlug: string, kbSlug: string): Observable<KbUser[]> {
    const url = `/${VERSION}/${ACCOUNT}/${accountSlug}/kb/${kbSlug}/users`;
    return this.api.get(url, true, undefined, true);
  }

  setKbUsers(accountSlug: string, kbSlug: string, data: SetUsersKb): Observable<void> {
    const url = `/${VERSION}/${ACCOUNT}/${accountSlug}/kb/${kbSlug}/users`;
    return this.api.patch(url, JSON.stringify(data), true, undefined, true);
  }

  inviteToKb(accountSlug: string, kbSlug: string, data: InviteKbData): Observable<void> {
    const url = `/${VERSION}/${ACCOUNT}/${accountSlug}/kb/${kbSlug}/invite`;
    return this.api.post(url, JSON.stringify(data), true, undefined, undefined, true);
  }

  inviteToAccount(slug: string, data: InviteAccountData): Observable<void> {
    const url = `/${VERSION}/${ACCOUNT}/${slug}/invite`;
    return this.api.post(url, JSON.stringify(data), true, undefined, undefined, true);
  }
}
