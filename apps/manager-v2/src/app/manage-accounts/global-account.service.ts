import { Injectable } from '@angular/core';
import { SDKService } from '@flaps/core';
import { catchError, forkJoin, map, Observable, of, switchMap } from 'rxjs';
import {
  AccountPatchPayload,
  AccountSummary,
  AccountUserType,
  BlockedFeature,
  BlockedFeaturesPayload,
  ExtendedAccount,
  KbRoles,
  KbSummary,
} from './global-account.models';
import { AccountBlockingState, AccountLimits, AccountLimitsPatchPayload, AccountTypes, Nuclia } from '@nuclia/core';
import {
  AccountConfigurationPayload,
  AccountDetails,
  AccountSummary as AccountSummaryUI,
  AccountUser,
  BlockedFeatureFormValues,
  KbCounters,
  KbDetails,
  KbSummary as KbSummaryUI,
} from './account-ui.models';
import { ZoneService } from '../manage-zones/zone.service';

const ACCOUNTS_ENDPOINT = '/manage/@accounts';
const ACCOUNT_ENDPOINT = '/manage/@account';
const KB_ENDPOINT = '@stashes';

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

  getKb(accountId: string, kbId: string): Observable<KbSummary> {
    return this.sdk.nuclia.rest.get(`${ACCOUNT_ENDPOINT}/${accountId}/${KB_ENDPOINT}/${kbId}`);
  }

  updateKb(accountId: string, kbId: string, data: { slug?: string; title?: string }): Observable<void> {
    return this.sdk.nuclia.rest.patch(`${ACCOUNT_ENDPOINT}/${accountId}/${KB_ENDPOINT}/${kbId}`, data);
  }

  updateKbUser(accountId: string, kbId: string, userId: string, newRole: KbRoles): Observable<void> {
    return this.sdk.nuclia.rest.patch(`${ACCOUNT_ENDPOINT}/${accountId}/${KB_ENDPOINT}/${kbId}/${userId}`, {
      role: newRole,
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

  loadKbCounters(id: string, kbList: KbSummaryUI[]): Observable<KbCounters> {
    return this.zoneService.getZones().pipe(
      switchMap((zones) => {
        const requests = kbList.map((kb) =>
          this.getKb(id, kb.id).pipe(
            switchMap((kb: KbSummary) => {
              const zone = zones.find((z) => z.id === kb.zone);
              if (!zone) {
                console.error(`No zone found for KB ${kb.slug}`, kb, zones);
                return of(null);
              }
              const specificNuclia = new Nuclia({
                ...this.sdk.nuclia.options,
                zone: zone.slug,
                knowledgeBox: kb.id,
              });
              return specificNuclia.knowledgeBox.counters().pipe(
                map((counters) => ({ kbId: kb.id, counters })),
                catchError((error) => {
                  console.error(`Loading counters for ${kb.slug} failed`, error);
                  return of(null);
                }),
              );
            }),
          ),
        );
        return requests.length > 0 ? forkJoin(requests) : of(null);
      }),
      map((responses) =>
        (responses || []).reduce((counters, response) => {
          if (response) {
            counters[response.kbId] = response.counters.resources;
          }
          return counters;
        }, {} as KbCounters),
      ),
    );
  }

  mapExtendedToDetails(extended: ExtendedAccount): AccountDetails {
    return {
      id: extended.id,
      title: extended.title,
      slug: extended.slug,
      type: extended.type,
      email: extended.email,
      trialExpirationDate: extended.trial_expiration_date,
      maxKbs: extended.stashes.max_stashes,
      dedicatedProcessorsState: extended.dedicated_processors_state,
      maxDedicatedProcessors: extended.max_dedicated_processors,
      blockingState: extended.blocking_state,
      limits: extended.limits as AccountLimits,
      users: extended.users,
    };
  }

  mapKbSummaryToDetails(accountId: string, kb: KbSummary): KbDetails {
    return {
      id: kb.id,
      slug: kb.slug,
      title: kb.title,
      created: kb.created,
      contributors: kb.contributors.map((user) => ({
        id: user.id,
        name: user.name || '',
        email: user.email,
        role: 'SCONTRIBUTOR',
      })),
      members: kb.members.map((user) => ({
        id: user.id,
        name: user.name || '',
        email: user.email,
        role: 'SMEMBER',
      })),
      owners: kb.owners.map((user) => ({
        id: user.id,
        name: user.name || '',
        email: user.email,
        role: 'SOWNER',
      })),
      accountId: accountId,
      zoneId: kb.zone,
    };
  }

  mapExtendedToKbList(extendedAccount: ExtendedAccount): KbSummaryUI[] {
    return (extendedAccount.stashes.items || []).map((item) => ({
      id: item.id,
      slug: item.slug,
      title: item.title,
      accountId: item.account,
      zoneId: item.zone,
    }));
  }

  mapAccountSummaryToAccountSummaryUI(summary: AccountSummary): AccountSummaryUI {
    return {
      ...summary,
      type: summary.type as AccountTypes,
    };
  }

  mapExtendedAccountToUsers(account: ExtendedAccount): AccountUser[] {
    return account.users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      isManager: account.managers.includes(user.id),
    }));
  }
}
