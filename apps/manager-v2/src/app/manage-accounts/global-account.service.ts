import { Injectable } from '@angular/core';
import { SDKService } from '@flaps/core';
import { Observable } from 'rxjs';
import {
  AccountPatchPayload,
  AccountSummary,
  AccountUserType,
  BlockedFeature,
  BlockedFeaturesPayload,
  ExtendedAccount,
} from './global-account.models';
import { AccountBlockingState, AccountLimitsPatchPayload } from '@nuclia/core';
import { AccountConfigurationPayload, BlockedFeatureFormValues } from './account-ui.models';
import { ZoneService } from '../manage-zones/zone.service';

const ACCOUNTS_ENDPOINT = '/manage/@accounts';
const ACCOUNT_ENDPOINT = '/manage/@account';

@Injectable({
  providedIn: 'root',
})
export class GlobalAccountService {
  constructor(
    private sdk: SDKService,
    private zoneService: ZoneService,
  ) {}

  getAccounts(): Observable<AccountSummary[]> {
    return this.sdk.nuclia.rest.get<AccountSummary[]>(ACCOUNTS_ENDPOINT);
  }

  getAccount(id: string): Observable<ExtendedAccount> {
    return this.sdk.nuclia.rest.get<ExtendedAccount>(`${ACCOUNT_ENDPOINT}/${id}`);
  }

  updateAccount(id: string, data: AccountConfigurationPayload): Observable<void> {
    const payload: AccountPatchPayload = {
      slug: data.slug,
      email: data.email,
      type: data.type,
      max_dedicated_processors: data.maxDedicatedProcessors,
      trial_expiration_date: data.trialExpirationDate,
      kbs: data.maxKbs,
      dedicated_processors_state: data.dedicatedProcessorsState,
    };
    return this.sdk.nuclia.rest.patch(`${ACCOUNT_ENDPOINT}/${id}`, payload);
  }

  updateAccountLimits(id: string, limits: AccountLimitsPatchPayload): Observable<void> {
    return this.sdk.nuclia.rest.patch(`${ACCOUNT_ENDPOINT}/${id}`, { limits });
  }

  deleteAccount(id: string): Observable<void> {
    return this.sdk.nuclia.rest.delete(`${ACCOUNT_ENDPOINT}/${id}`);
  }

  updateBlockedFeatures(id: string, formValue: BlockedFeatureFormValues): Observable<void> {
    const blockedFeatures = Object.entries(formValue).reduce((blockedFeatures, [feature, blocked]) => {
      if (blocked) {
        blockedFeatures.push(<BlockedFeature>feature);
      }
      return blockedFeatures;
    }, [] as BlockedFeature[]);
    const payload: BlockedFeaturesPayload = {
      blocking_state: blockedFeatures.length > 0 ? AccountBlockingState.MANAGER : AccountBlockingState.UNBLOCKED,
      blocked_features: blockedFeatures,
    };
    return this.sdk.nuclia.rest.patch(`${ACCOUNT_ENDPOINT}/${id}/blocking_status`, payload);
  }

  addAccountUser(accountId: string, userId: string): Observable<void> {
    return this.sdk.nuclia.rest.post(`${ACCOUNT_ENDPOINT}/${accountId}`, { id: userId });
  }

  updateAccountUserType(accountId: string, userId: string, newType: AccountUserType): Observable<void> {
    return this.sdk.nuclia.rest.patch(`${ACCOUNT_ENDPOINT}/${accountId}/${userId}`, { type: newType });
  }

  removeAccountUser(accountId: string, userId: string): Observable<void> {
    return this.sdk.nuclia.rest.delete(`${ACCOUNT_ENDPOINT}/${accountId}/${userId}`);
  }
}
