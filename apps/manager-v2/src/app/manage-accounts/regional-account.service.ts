import { inject, Injectable } from '@angular/core';
import { SDKService } from '@flaps/core';
import { catchError, forkJoin, map, Observable, of, switchMap, tap } from 'rxjs';
import { AccountDetails, AccountUser, KbCounters, KbDetails, KbSummary } from './account-ui.models';
import { Account, Kb } from './regional-account.models';
import { ZoneService } from '../manage-zones/zone.service';
import { KBRoles, Nuclia } from '@nuclia/core';

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
    return forkJoin([this.zoneService.getZoneSlugs(), this.sdk.nuclia.db.getKbIndexes(accountSlug)]).pipe(
      switchMap(([zoneSlugs, indexes]) =>
        forkJoin(
          indexes.map((index) =>
            this.sdk.nuclia.rest
              .get<Kb>(
                `${ACCOUNT_ENDPOINT}/${index.account_id}/kb/${index.kb_id}`,
                undefined,
                undefined,
                zoneSlugs[index.zone_id],
              )
              .pipe(map((kb) => ({ ...kb, accountId: index.account_id, zoneId: index.zone_id }))),
          ),
        ),
      ),
    );
  }

  loadKbCounters(kbList: KbSummary[]): Observable<KbCounters> {
    return this.zoneService.getZoneSlugs().pipe(
      switchMap((zoneSlugs) => {
        const requests = kbList.map((kb) => {
          const zoneSlug = zoneSlugs[kb.zoneId];
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
            counters[response.kbId] = response.counters.resources;
          }
          return counters;
        }, {} as KbCounters),
      ),
    );
  }

  getKbDetails(kbSummary: KbSummary, accountDetails: AccountDetails): Observable<KbDetails> {
    return this.getKbZoneSlug(kbSummary).pipe(
      switchMap((zoneSlug) => {
        if (!zoneSlug) {
          return of(kbSummary as KbDetails);
        }

        const kbPath = `${ACCOUNT_ENDPOINT}/${kbSummary.accountId}/kb/${kbSummary.id}`;
        return forkJoin([
          this.sdk.nuclia.rest.get<Kb>(kbPath, undefined, undefined, zoneSlug),
          this.sdk.nuclia.rest.get<SimpleKbUser[]>(`${kbPath}/users`, undefined, undefined, zoneSlug),
        ]).pipe(
          map(([kb, users]) => {
            const kbDetails: KbDetails = {
              ...kbSummary,
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
      dedicatedProcessorsState: account.dedicated_processors_state,
      email: account.email,
      limits: account.limits,
      maxDedicatedProcessors: account.max_dedicated_processors,
      maxKbs: account.stashes.max_stashes,
      trialExpirationDate: account.trial_expiration_date,
      users: account.users,
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

  private getKbZoneSlug(kbSummary: KbSummary): Observable<string | undefined> {
    return this.zoneService.getZoneSlug(kbSummary.zoneId).pipe(
      tap((zoneSlug) => {
        if (!zoneSlug) {
          console.error(`No zone found for KB`, kbSummary);
        }
      }),
    );
  }
}
