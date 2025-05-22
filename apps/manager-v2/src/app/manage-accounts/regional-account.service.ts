import { inject, Injectable } from '@angular/core';
import { STATUS_FACET } from '@flaps/common';
import { SDKService } from '@flaps/core';
import { KBRoles, Nuclia } from '@nuclia/core';
import { catchError, forkJoin, map, Observable, of, switchMap, take, tap } from 'rxjs';
import { ZoneSummary } from '../manage-zones/zone.models';
import { ZoneService } from '../manage-zones/zone.service';
import { AccountDetails, AccountUser, KbCounters, KbDetails, KbSummary } from './account-ui.models';
import {
  Account,
  AccountModel,
  AccountModelPayload,
  AccountModelSummary,
  Kb,
  ZoneModels,
} from './regional-account.models';

const MANAGE_ACCOUNT_ENDPOINT = '/manage/@account';
const ACCOUNT_ENDPOINT = '/account';

interface SimpleKbUser {
  id: string;
  role: KBRoles;
}

@Injectable({
  providedIn: 'root',
})
export class RegionalAccountService {
  private sdk = inject(SDKService);
  private zoneService = inject(ZoneService);

  getAccount(accountId: string): Observable<Account> {
    return this.sdk.nuclia.rest.get<Account>(`${MANAGE_ACCOUNT_ENDPOINT}/${accountId}`);
  }

  getKbList(accountSlug: string): Observable<KbSummary[]> {
    return forkJoin([this.zoneService.getZoneDict(), this.sdk.nuclia.db.getKbIndexes(accountSlug)]).pipe(
      switchMap(([zoneDict, indexes]) =>
        indexes.length === 0
          ? of([])
          : forkJoin(
              indexes.map((index) => {
                const zone = zoneDict[index.zone_id];
                return this.sdk.nuclia.rest
                  .get<Kb>(`${ACCOUNT_ENDPOINT}/${index.account_id}/kb/${index.kb_id}`, undefined, undefined, zone.slug)
                  .pipe(
                    map((kb) => ({
                      ...kb,
                      accountId: index.account_id,
                      zone,
                      private: kb.state === 'PRIVATE',
                      activity: {
                        redash: `http://redash.nuclia.com/queries/24?p_KB=${kb.id}`,
                        grafana: `http://platform.grafana.nuclia.com/d/${
                          index.account_id
                        }/1-nucliadb-knowledgebox?orgId=1&var-kbid=${kb.id}&var-cluster=${
                          zone.slug === 'europe-1' ? 'flaps' : zone.slug
                        }&var-container=All&var-service=All&var-trace_min_duration=0s&from=now-12h&to=now`,
                      },
                    })),
                    catchError(() => {
                      console.error(`Loading KB ${index.kb_id} failed`);
                      return of(undefined);
                    }),
                  );
              }),
            ).pipe(map((kbs) => kbs.filter((kb) => !!kb) as KbSummary[])),
      ),
    );
  }

  loadKbCounters(kbList: KbSummary[]): Observable<KbCounters> {
    return this.zoneService.getZoneDict().pipe(
      switchMap((zoneSlugs) => {
        const requests = kbList.map((kb) => {
          const zoneSlug = zoneSlugs[kb.zone.id].slug;
          if (!zoneSlug) {
            console.error(`No zone found for KB ${kb.slug}`, kb, zoneSlugs);
            return of(null);
          }
          const specificNuclia = new Nuclia({
            ...this.sdk.nuclia.options,
            zone: zoneSlug,
            knowledgeBox: kb.id,
          });
          return specificNuclia.knowledgeBox.counters().pipe(
            map((counters) => ({ kbId: kb.id, counters })),
            switchMap((partialResponse) =>
              specificNuclia.knowledgeBox.catalog('', { faceted: [STATUS_FACET] }).pipe(
                map((data) => {
                  let resources = { total: partialResponse.counters.resources, pending: -1, error: -1 };
                  if (data.type === 'searchResults') {
                    const facet = data.fulltext?.facets?.[STATUS_FACET];
                    resources = {
                      ...resources,
                      pending: facet?.[`${STATUS_FACET}/PENDING`] || 0,
                      error: facet?.[`${STATUS_FACET}/ERROR`] || 0,
                    };
                  }

                  return { ...partialResponse, resources };
                }),
                catchError((error) => {
                  console.error(`Loading resource counters for ${kb.slug} failed`, error);
                  return of({
                    ...partialResponse,
                    resources: { total: partialResponse.counters.resources, pending: -1, error: -1 },
                  });
                }),
              ),
            ),
            catchError((error) => {
              console.error(`Loading counters for ${kb.slug} failed`, error);
              return of(null);
            }),
          );
        });
        return requests.length > 0 ? forkJoin(requests) : of(null);
      }),
      map((responses) =>
        (responses || []).reduce((counters, response) => {
          if (response) {
            counters[response.kbId] = {
              ...response.counters,
              resources: response.resources,
            };
          }
          return counters;
        }, {} as KbCounters),
      ),
    );
  }

  getKbDetails(kbSummary: KbSummary, accountDetails: AccountDetails): Observable<KbDetails> {
    return this.getKbZone(kbSummary).pipe(
      switchMap((zone) => {
        if (!zone) {
          return of(kbSummary as KbDetails);
        }

        const zoneSlug = zone.slug;
        const kbPath = `${ACCOUNT_ENDPOINT}/${kbSummary.accountId}/kb/${kbSummary.id}`;
        return forkJoin([
          this.sdk.nuclia.rest.get<Kb>(kbPath, undefined, undefined, zoneSlug),
          this.sdk.nuclia.rest.get<SimpleKbUser[]>(`${kbPath}/users`, undefined, undefined, zoneSlug),
        ]).pipe(
          map(([kb, users]) => {
            const kbDetails: KbDetails = {
              ...kbSummary,
              zone,
              slug: kb.slug,
              title: kb.title,
              created: kb.created,
              contributors: [],
              members: [],
              owners: [],
            };
            users.forEach((user) => {
              const accountUser = accountDetails.users.find((accountUser) => accountUser.id === user.id);
              if (accountUser) {
                const kbUser = {
                  ...user,
                  name: accountUser.name || '',
                  email: accountUser.email,
                };
                switch (user.role) {
                  case 'SOWNER':
                    kbDetails.owners.push(kbUser);
                    break;
                  case 'SCONTRIBUTOR':
                    kbDetails.contributors.push(kbUser);
                    break;
                  case 'SMEMBER':
                    kbDetails.members.push(kbUser);
                    break;
                }
              }
            });
            return kbDetails;
          }),
        );
      }),
    );
  }

  updateKb(kbSummary: KbSummary, data: { slug?: string; title?: string }) {
    const kbPath = `${ACCOUNT_ENDPOINT}/${kbSummary.accountId}/kb/${kbSummary.id}`;
    return this.getKbZoneSlug(kbSummary).pipe(
      switchMap((zoneSlug) => {
        if (!zoneSlug) {
          return of();
        }
        return this.sdk.nuclia.rest.patch<unknown>(kbPath, data, undefined, undefined, true, zoneSlug);
      }),
    );
  }

  updateKbUsers(
    kbSummary: KbSummary,
    data: { add: SimpleKbUser[]; update: SimpleKbUser[]; delete: string[] },
  ): Observable<void> {
    const kbPath = `${ACCOUNT_ENDPOINT}/${kbSummary.accountId}/kb/${kbSummary.id}/users`;
    return this.getKbZoneSlug(kbSummary).pipe(
      switchMap((zoneSlug) => {
        if (!zoneSlug) {
          return of();
        }
        return this.sdk.nuclia.rest.patch<void>(kbPath, data, undefined, undefined, true, zoneSlug);
      }),
    );
  }

  mapAccountToDetails(account: Account): AccountDetails {
    return {
      id: account.id,
      slug: account.slug,
      title: account.title,
      type: account.type,
      blockingState: account.blocking_state,
      email: account.email,
      limits: account.limits,
      maxKbs: account.stashes.max_stashes,
      maxArags: account.arags.max_arags,
      trialExpirationDate: account.trial_expiration_date,
      users: account.users,
      created: account.created,
    };
  }

  mapExtendedAccountToUsers(account: Account): AccountUser[] {
    return account.users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      isManager: account.managers.includes(user.id),
    }));
  }

  private getKbZone(kbSummary: KbSummary): Observable<ZoneSummary | undefined> {
    return this.zoneService.getZoneDict().pipe(
      map((zoneDict) => {
        const zone = zoneDict[kbSummary.zone.id];
        if (!zone) {
          console.error(`No zone found for KB`, kbSummary);
        }
        return zone;
      }),
    );
  }

  private getKbZoneSlug(kbSummary: KbSummary): Observable<string | undefined> {
    return this.zoneService.getZoneSlug(kbSummary.zone.id).pipe(
      tap((zoneSlug) => {
        if (!zoneSlug) {
          console.error(`No zone found for KB`, kbSummary);
        }
      }),
    );
  }

  getModels(accountId: string, zoneSlug: string) {
    return this.sdk.nuclia.rest.get<AccountModelSummary[]>(
      `/account/${accountId}/models`,
      undefined,
      undefined,
      zoneSlug,
    );
  }

  getModel(modelId: string, accountId: string, zoneSlug: string) {
    return this.sdk.nuclia.rest.get<AccountModel>(
      `/account/${accountId}/model/${modelId}`,
      undefined,
      undefined,
      zoneSlug,
    );
  }

  createModel(data: AccountModelPayload, accountId: string, zoneSlug: string) {
    return this.sdk.nuclia.rest.post<{ id: string }>(
      `/account/${accountId}/models`,
      data,
      undefined,
      undefined,
      true,
      zoneSlug,
    );
  }

  deleteModel(modelId: string, accountId: string, zoneSlug: string) {
    return this.sdk.nuclia.rest.delete(`/account/${accountId}/model/${modelId}`, undefined, true, zoneSlug);
  }

  getModelsPerZone(accountId: string): Observable<ZoneModels[]> {
    return this.zoneService.getZoneDict().pipe(
      take(1),
      switchMap((zones) =>
        forkJoin(
          Object.values(zones).map((zone) =>
            this.getModels(accountId, zone.slug).pipe(
              map((models) => ({ zone, models })),
              catchError(() => of({ zone, models: [] })),
            ),
          ),
        ),
      ),
    );
  }

  addModelToKb(modelId: string, accountId: string, kbId: string, zoneSlug: string) {
    return this.sdk.nuclia.rest.post<void>(
      `/account/${accountId}/models/${kbId}`,
      { id: modelId },
      undefined,
      undefined,
      true,
      zoneSlug,
    );
  }

  deleteModelFromKb(modelId: string, accountId: string, kbId: string, zoneSlug: string) {
    return this.sdk.nuclia.rest.delete(`/account/${accountId}/models/${kbId}/${modelId}`, undefined, true, zoneSlug);
  }
}
