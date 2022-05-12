import { filter, map, Observable, of, switchMap, tap } from 'rxjs';
import type { INuclia, IDb } from '../models';
import { Account, AccountCreation, AccountStatus, ProcessingStat, StatsPeriod, StatsType, Welcome } from './db.models';
import type { IKnowledgeBox, KnowledgeBoxCreation, IKnowledgeBoxItem } from './kb.models';
import { WritableKnowledgeBox } from './kb';
import { upload, uploadToProcess } from './upload';

export class Db implements IDb {
  private nuclia: INuclia;

  public constructor(nuclia: INuclia) {
    this.nuclia = nuclia;
  }

  getAccounts(): Observable<Account[]> {
    return this.nuclia.rest.get<Account[]>('/accounts');
  }

  createAccount(account: AccountCreation): Observable<Account> {
    return this.nuclia.rest.post<Account>('/accounts', account);
  }

  modifyAccount(account: string, data: Partial<Account>): Observable<void> {
    return this.nuclia.rest.patch<void>(`/account/${account}`, data);
  }

  getAccountStatus(account: string): Observable<AccountStatus> {
    return this.nuclia.rest.get<AccountStatus>(`/account/${account}/status`);
  }

  getWelcome(): Observable<Welcome> {
    return this.nuclia.rest.get<Welcome>('/user/welcome');
  }

  getAccount(): Observable<Account>;
  getAccount(account?: string): Observable<Account> {
    account = account || this.nuclia.options.account;
    if (!account) {
      throw new Error('Account is not set');
    }
    return this.nuclia.rest.get<Account>(`/account/${account}`);
  }

  getKnowledgeBoxes(account: string): Observable<IKnowledgeBoxItem[]> {
    return this.nuclia.rest.get<IKnowledgeBoxItem[]>(`/account/${account}/kbs`);
  }

  getKnowledgeBox(): Observable<WritableKnowledgeBox>;
  getKnowledgeBox(account: string, knowledgeBox: string): Observable<WritableKnowledgeBox>;
  getKnowledgeBox(account?: string, knowledgeBox?: string): Observable<WritableKnowledgeBox> {
    account = account || this.nuclia.options.account;
    if (account) {
      const knowledgeBoxSlug = knowledgeBox || this.nuclia.options.knowledgeBox || this.nuclia.options.kbSlug;
      if (!knowledgeBoxSlug) {
        throw new Error('account and knowledgeBox must be defined in the Nuclia options');
      }
      return this.nuclia.rest.get<IKnowledgeBox>(`/account/${account}/kb/${knowledgeBoxSlug}`).pipe(
        switchMap((kb) =>
          this.nuclia.options.zone
            ? of(kb)
            : this.nuclia.rest.getZones().pipe(
                tap((zones) => (this.nuclia.options.zone = zones[kb.zone])),
                map(() => kb),
              ),
        ),
        map((kb) => new WritableKnowledgeBox(this.nuclia, account as string, kb)),
      );
    } else {
      if (!this.nuclia.options.knowledgeBox || !this.nuclia.options.zone) {
        throw new Error('zone must be defined in the Nuclia options');
      }
      return of(
        new WritableKnowledgeBox(this.nuclia, '', {
          id: this.nuclia.options.knowledgeBox,
          zone: this.nuclia.options.zone,
        }),
      );
    }
  }

  createKnowledgeBox(account: string, knowledgeBox: KnowledgeBoxCreation): Observable<WritableKnowledgeBox> {
    return this.nuclia.rest
      .post<IKnowledgeBox>(`/account/${account}/kbs`, knowledgeBox)
      .pipe(switchMap(() => this.getKnowledgeBox(account, knowledgeBox.slug)));
  }

  getStats(
    account: string,
    type: StatsType,
    knowledgeBox?: string,
    period: StatsPeriod = StatsPeriod.DAY,
    utctime?: string,
  ): Observable<ProcessingStat[]> {
    const params = [`period=${period}`, `stats=${type}`];
    if (utctime) {
      params.push(`utctime=${utctime}`);
    }
    if (knowledgeBox) {
      params.push(`knowledgebox=${knowledgeBox}`);
    }
    return this.nuclia.rest.get<{ data: ProcessingStat[] }>(`/account/${account}/stats?${params.join('&')}`).pipe(
      map((response) => response.data),
      filter((data) => !!data),
    );
  }

  upload(file: File): Observable<void> {
    if (!this.nuclia.options.zoneKey) {
      throw new Error('zoneKey must be defined in the Nuclia options to be able to call /process');
    }
    return uploadToProcess(this.nuclia, file).pipe(
      switchMap((token) =>
        this.nuclia.rest.post<void>(
          '/processing/push',
          {
            uuid: 'fake',
            kbid: 'fake',
            filefield: { file: token },
          },
          { 'x-stf-zonekey': `Bearer ${this.nuclia.options.zoneKey}` },
        ),
      ),
      tap((res) => console.log(res)),
    );
  }
}
