import { Injectable } from '@angular/core';
import { SDKService } from '@flaps/core';
import { Observable } from 'rxjs';
import {
  AccountCreationPayload,
  AccountPatchPayload,
  AccountSummary,
  BlockedFeature,
  BlockedFeaturesPayload,
  ExtendedAccount,
  KbRoles,
  KbSummary,
  ZoneSummary,
} from './account.models';
import { AccountBlockingState } from '@nuclia/core';

const ACCOUNTS_ENDPOINT = '/manage/@accounts';
const ACCOUNT_ENDPOINT = '/manage/@account';
const ZONE_ENDPOINT = '/manage/@zones';
const KB_ENDPOINT = '@stashes';

@Injectable({
  providedIn: 'root',
})
export class AccountService {
  constructor(private sdk: SDKService) {}

  getAccounts(): Observable<AccountSummary[]> {
    return this.sdk.nuclia.rest.get<AccountSummary[]>(ACCOUNTS_ENDPOINT);
  }

  getAccount(id: string): Observable<ExtendedAccount> {
    return this.sdk.nuclia.rest.get<ExtendedAccount>(`${ACCOUNT_ENDPOINT}/${id}`);
  }

  createAccount(account: AccountCreationPayload): Observable<unknown> {
    return this.sdk.nuclia.rest.post(ACCOUNTS_ENDPOINT, account);
  }

  updateAccount(id: string, data: AccountPatchPayload): Observable<void> {
    return this.sdk.nuclia.rest.patch(`${ACCOUNT_ENDPOINT}/${id}`, data);
  }

  deleteAccount(id: string): Observable<void> {
    return this.sdk.nuclia.rest.delete(`${ACCOUNT_ENDPOINT}/${id}`);
  }

  getZones(): Observable<ZoneSummary[]> {
    return this.sdk.nuclia.rest.get(ZONE_ENDPOINT);
  }

  updateBlockedFeatures(
    id: string,
    formValue: {
      generative: boolean;
      search: boolean;
      upload: boolean;
      processing: boolean;
    },
  ): Observable<void> {
    const blockedFeatures = Object.entries(formValue).reduce((blockedFeatures, [feature, blocked]) => {
      if (blocked) {
        blockedFeatures.push(feature as BlockedFeature);
      }
      return blockedFeatures;
    }, [] as BlockedFeature[]);
    const payload: BlockedFeaturesPayload = {
      blocking_state: blockedFeatures.length > 0 ? AccountBlockingState.MANAGER : AccountBlockingState.UNBLOCKED,
      blocked_features: blockedFeatures,
    };
    return this.sdk.nuclia.rest.patch(`${ACCOUNT_ENDPOINT}/${id}/blocking_status`, payload);
  }

  getKb(accountId: string, kbId: string): Observable<KbSummary> {
    return this.sdk.nuclia.rest.get(`${ACCOUNT_ENDPOINT}/${accountId}/${KB_ENDPOINT}/${kbId}`);
  }

  updateKb(accountId: string, kbId: string, data: { slug?: string; title?: string }): Observable<void> {
    return this.sdk.nuclia.rest.patch(`${ACCOUNT_ENDPOINT}/${accountId}/${KB_ENDPOINT}/${kbId}`, data);
  }

  updateKbUser(accountId: string, kbId: string, userId: string, newRole: KbRoles): Observable<void> {
    return this.sdk.nuclia.rest.patch(`${ACCOUNT_ENDPOINT}/${accountId}/${KB_ENDPOINT}/${kbId}/${userId}`, {
      type: newRole,
    });
  }

  addKbUser(accountId: string, kbId: string, userId: string): Observable<void> {
    return this.sdk.nuclia.rest.post(`${ACCOUNT_ENDPOINT}/${accountId}/${KB_ENDPOINT}/${kbId}`, {
      user: userId,
      stash: kbId,
    });
  }

  removeKbUser(accountId: string, kbId: string, userId: string): Observable<void> {
    return this.sdk.nuclia.rest.delete(`${ACCOUNT_ENDPOINT}/${accountId}/${KB_ENDPOINT}/${kbId}/${userId}`);
  }
}
