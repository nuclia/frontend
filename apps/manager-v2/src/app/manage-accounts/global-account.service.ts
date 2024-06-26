import { Injectable } from '@angular/core';
import { SDKService } from '@flaps/core';
import { Observable } from 'rxjs';
import {
  AccountPatchPayload,
  AccountSummary,
  AccountUserType,
  BillingFormula,
  BlockedFeature,
  BlockedFeaturesPayload,
  ExtendedAccount,
  PaymentLinkPayload,
  SearchPrice,
} from './global-account.models';
import { AccountBlockingState, AccountLimitsPatchPayload, AccountTypes } from '@nuclia/core';
import { AccountConfigurationPayload, BlockedFeatureFormValues } from './account-ui.models';

const ACCOUNTS_ENDPOINT = '/manage/@accounts';
const ACCOUNT_ENDPOINT = '/manage/@account';

@Injectable({
  providedIn: 'root',
})
export class GlobalAccountService {
  constructor(private sdk: SDKService) {}

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
      trial_expiration_date: data.trialExpirationDate,
      kbs: data.maxKbs,
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

  getSearchPrice(usageType: 'licensed' | 'metered', accountType?: AccountTypes) {
    const params = `usage_type=${usageType}`+ (accountType ? `&account_type=${accountType}` : '');
    return this.sdk.nuclia.rest.get<SearchPrice[]>(`/billing/stripe/search_prices?${params}`);
  }
  getBillingFormulas() {
    return this.sdk.nuclia.rest.get<BillingFormula[]>(`/billing/formula`);
  }
  createPaymentLink(data: PaymentLinkPayload) {
    return this.sdk.nuclia.rest.post<{ id: string; url: string }>(`/billing/stripe/payment_links`, data);
  }
}
