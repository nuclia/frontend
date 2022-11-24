import { catchError, filter, map, Observable, of, switchMap, tap } from 'rxjs';
import type { IDb, INuclia } from '../models';
import {
  Account,
  AccountCreation,
  AccountStatus,
  NUA_CLIENT,
  NUA_KEY,
  NUAClient,
  NUAClientPayload,
  ProcessingPullResponse,
  ProcessingPushResponse,
  ProcessingStat,
  ProcessingStatusResponse,
  StatsPeriod,
  StatsRange,
  StatsType,
  Welcome,
} from './db.models';
import type { EventList, IKnowledgeBox, IKnowledgeBoxItem, KnowledgeBoxCreation } from './kb';
import { WritableKnowledgeBox } from './kb';
import { FileWithMetadata, uploadToProcess } from './upload';

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

  deleteAccount(account: string): Observable<void> {
    return this.nuclia.rest.delete(`/account/${account}`);
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
            : this.nuclia.rest.getZoneSlug(kb.zone).pipe(
                tap((zone) => (this.nuclia.options.zone = zone)),
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
    return this.nuclia.rest.post<IKnowledgeBox>(`/account/${account}/kbs`, knowledgeBox).pipe(
      tap((res) => {
        if (!res.id) {
          throw 'KnowledgeBox creation failed';
        }
      }),
      switchMap(() => this.getKnowledgeBox(account, knowledgeBox.slug)),
    );
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

  upload(file: FileWithMetadata): Observable<ProcessingPushResponse> {
    if (!this.hasNUAClient()) {
      throw new Error('NUA key is needed to be able to call /process');
    }
    return uploadToProcess(this.nuclia, file, { md5: file.md5 }).pipe(
      switchMap((token) =>
        this.nuclia.rest.post<ProcessingPushResponse>(
          '/processing/push',
          {
            filefield: { file: token },
          },
          this.getNUAHeader(),
        ),
      ),
    );
  }

  pull(): Observable<ProcessingPullResponse> {
    if (!this.hasNUAClient()) {
      throw new Error('NUA key is needed to be able to call /processing');
    }
    return this.nuclia.rest.get<ProcessingPullResponse>('/processing/pull', this.getNUAHeader());
  }

  getProcessingStatus(accountId?: string): Observable<ProcessingStatusResponse> {
    if (!accountId) {
      const hasNUAKey = this.hasNUAClient();
      if (!hasNUAKey) {
        throw new Error('NUA key or account id is needed to be able to call /processing/status');
      }
    }
    const endpoint = !accountId ? '/processing/status' : `/processing/status?account_id=${accountId}`;
    const headers = !accountId ? this.getNUAHeader() : undefined;

    return this.nuclia.rest.get(endpoint, headers);
  }

  getProcessingStats(range?: StatsRange, accountId?: string): Observable<ProcessingStat[]> {
    const hasNUAKey = this.hasNUAClient();
    if (!accountId && !hasNUAKey) {
      throw new Error('NUA key or account id is needed to be able to call /processing/stats');
    }
    const endpoint = hasNUAKey
      ? `/processing/stats${range ? '?period=' + range : ''}`
      : `/processing/stats?account_id=${accountId}${range ? '&period=' + range : ''}`;
    const headers = hasNUAKey ? this.getNUAHeader() : undefined;
    return this.nuclia.rest.get<{ data: ProcessingStat[] }>(endpoint, headers).pipe(map((res) => res.data));
  }

  getNUAActivity(accountSlug: string, client_id: string, pageIndex = 0): Observable<EventList> {
    return this.nuclia.rest.get<EventList>(
      `/account/${accountSlug}/nua_client/${client_id}/activity?page=${pageIndex}`,
    );
  }

  getNUAClients(account: string): Observable<NUAClient[]> {
    return this.nuclia.rest
      .get<{ clients: NUAClient[] }>(`/account/${account}/nua_clients`)
      .pipe(map((res) => res.clients));
  }

  getNUAClient(account: string, client_id: string): Observable<NUAClient> {
    return this.nuclia.rest.get<NUAClient>(`/account/${account}/nua_client/${client_id}`);
  }

  hasNUAClient(): boolean {
    return !!localStorage.getItem(NUA_CLIENT) && !!localStorage.getItem(NUA_KEY);
  }

  getNUAHeader(): { 'x-stf-nuakey': string } {
    return {
      'x-stf-nuakey': `Bearer ${localStorage.getItem(NUA_KEY)}`,
    };
  }

  createNUAClient(account: string, data: NUAClientPayload): Observable<{ client_id: string; token: string }> {
    const payload: NUAClientPayload & { processing_webhook?: { uri: string } } = { ...data };
    if (payload.webhook) {
      payload.processing_webhook = { uri: payload.webhook };
      delete payload.webhook;
    }
    return this.nuclia.rest.post<{ client_id: string; token: string }>(`/account/${account}/nua_clients`, payload).pipe(
      catchError((err) => {
        if (err.status === 409 && data.client_id) {
          return this.renewNUAClient(account, data.client_id);
        } else {
          throw err;
        }
      }),
      tap((key) => {
        if (this.nuclia.options.client === 'desktop') {
          localStorage.setItem(NUA_KEY, key.token);
          localStorage.setItem(NUA_CLIENT, key.client_id);
        }
      }),
    );
  }

  renewNUAClient(account: string, client_id: string): Observable<{ client_id: string; token: string }> {
    return this.nuclia.rest.put<{ client_id: string; token: string }>(
      `/account/${account}/nua_client/${client_id}/key`,
      {},
    );
  }

  deleteNUAClient(account: string, client_id: string): Observable<void> {
    return this.nuclia.rest.delete(`/account/${account}/nua_client/${client_id}`);
  }
}
