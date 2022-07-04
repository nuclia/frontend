import { APIService } from '@flaps/core';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Account,
  AccountSummary,
  AccountCreation,
  AccountPatch,
  AccountUserCreation,
  AccountUserPatch,
  ActiveCampaignStart,
} from '../models/account.model';
import {
  KnowledgeBoxCreation,
  StashCreated,
  StashSummary,
  ManagerStash,
  StashPatch,
  StashAddUser,
  StashPatchUser,
} from '../models/stash.model';
const STF_ACCOUNT = '/manage/@account';
const STF_ACCOUNTS = '/manage/@accounts';

const STF_STASHES = '@stashes';
const STF_AC = '@ac';

@Injectable({
  providedIn: 'root',
})
export class AccountService {
  constructor(private api: APIService) {}

  getAccounts(): Observable<AccountSummary[]> {
    return this.api.get(STF_ACCOUNTS, true, undefined, true);
  }

  getAccount(id: string): Observable<Account> {
    return this.api.get(STF_ACCOUNT + '/' + id, true, undefined, true);
  }

  create(account: AccountCreation) {
    return this.api.post(STF_ACCOUNTS, account, true, undefined, undefined, true);
  }

  edit(accountId: string, account: AccountPatch) {
    return this.api.patch(STF_ACCOUNT + '/' + accountId, account, true, undefined, true);
  }

  deleteAccount(accountId: string) {
    return this.api.delete(STF_ACCOUNT + '/' + accountId, true, true);
  }

  addAccountUser(accountId: string, user: AccountUserCreation) {
    return this.api.post(STF_ACCOUNT + '/' + accountId, user, true, undefined, undefined, true);
  }

  deleteUser(accountId: string, userId: string) {
    return this.api.delete(STF_ACCOUNT + '/' + accountId + '/' + userId, true, true);
  }

  setAdminStashifyUser(accountId: string, userId: string) {
    return this.setUserPermission(accountId, userId, { type: 'manager' });
  }

  delAdminStashifyUser(accountId: string, userId: string) {
    return this.setUserPermission(accountId, userId, { type: 'member' });
  }

  private setUserPermission(accountId: string, userId: string, data: AccountUserPatch) {
    return this.api.patch(STF_ACCOUNT + '/' + accountId + '/' + userId, data, true, undefined, true);
  }

  createStash(accountId: string, data: KnowledgeBoxCreation): Observable<StashCreated> {
    return this.api.post(STF_ACCOUNT + '/' + accountId + '/' + STF_STASHES, data, true, undefined, undefined, true);
  }

  getStash(accountId: string, stashId: string): Observable<ManagerStash> {
    return this.api.get(STF_ACCOUNT + '/' + accountId + '/' + STF_STASHES + '/' + stashId, true, undefined, true);
  }

  editStash(accountId: string, stashId: string, data: StashPatch) {
    return this.api.patch(
      STF_ACCOUNT + '/' + accountId + '/' + STF_STASHES + '/' + stashId,
      data,
      true,
      undefined,
      true,
    );
  }

  addStashUser(accountId: string, stashId: string, user: StashAddUser) {
    return this.api.post(
      STF_ACCOUNT + '/' + accountId + '/' + STF_STASHES + '/' + stashId,
      user,
      true,
      undefined,
      undefined,
      true,
    );
  }

  setStashUser(accountId: string, stashId: string, user: string, data: StashPatchUser) {
    return this.api.patch(
      STF_ACCOUNT + '/' + accountId + '/' + STF_STASHES + '/' + stashId + '/' + user,
      data,
      true,
      undefined,
      true,
    );
  }

  delStashUser(accountId: string, stashId: string, userId: string) {
    return this.api.delete(
      STF_ACCOUNT + '/' + accountId + '/' + STF_STASHES + '/' + stashId + '/' + userId,
      true,
      true,
    );
  }

  getStashes(accountId: string): Observable<StashSummary> {
    return this.api.get(STF_ACCOUNT + '/' + accountId + STF_STASHES, true, undefined, true);
  }

  startACCampaign(accountId: string, campaign: ActiveCampaignStart) {
    return this.api.post(STF_ACCOUNT + '/' + accountId + '/' + STF_AC, campaign, true, undefined, undefined, true);
  }
}
