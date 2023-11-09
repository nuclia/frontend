import { Injectable } from '@angular/core';
import { AccountUser, InviteAccountData, InviteKbData, KbUser, SetUsersAccount, SetUsersKb, User } from '../models';
import { Observable } from 'rxjs';
import { SDKService } from './sdk.service';

const ACCOUNT = 'account';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  constructor(private sdk: SDKService) {}

  getAccountUser(slug: string, id: string): Observable<Partial<User>> {
    return this.sdk.nuclia.rest.get(`/${ACCOUNT}/${slug}/user/${id}`);
  }

  getAccountUsers(slug: string): Observable<AccountUser[]> {
    return this.sdk.nuclia.rest.get(`/${ACCOUNT}/${slug}/users`);
  }

  setAccountUsers(slug: string, users: SetUsersAccount): Observable<void> {
    const url = `/${ACCOUNT}/${slug}/users`;
    return this.sdk.nuclia.rest.patch(url, users);
  }

  getKbUsers(accountSlug: string, kbSlug: string): Observable<KbUser[]> {
    const url = `/${ACCOUNT}/${accountSlug}/kb/${kbSlug}/users`;
    return this.sdk.nuclia.rest.get(url);
  }

  setKbUsers(accountSlug: string, kbSlug: string, data: SetUsersKb): Observable<void> {
    const url = `/${ACCOUNT}/${accountSlug}/kb/${kbSlug}/users`;
    return this.sdk.nuclia.rest.patch(url, data);
  }

  inviteToKb(accountSlug: string, kbSlug: string, data: InviteKbData): Observable<void> {
    const url = `/${ACCOUNT}/${accountSlug}/kb/${kbSlug}/invite`;
    return this.sdk.nuclia.rest.post(url, data);
  }

  inviteToAccount(slug: string, data: InviteAccountData): Observable<void> {
    const url = `/${ACCOUNT}/${slug}/invite`;
    return this.sdk.nuclia.rest.post(url, data);
  }
}
