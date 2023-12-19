import { catchError, concatMap, filter, forkJoin, from, map, Observable, of, switchMap, tap, throwError } from 'rxjs';
import type { AccountUsersPayload, FullAccountUser, IDb, INuclia, InviteAccountUserPayload } from '../models';
import type { KbIndex, LearningConfigurations, PredictedToken } from './db.models';
import {
  Account,
  AccountCreation,
  AccountStatus,
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
import { IStandaloneKb, WritableKnowledgeBox } from './kb';
import { FileWithMetadata, uploadToProcess } from './upload';

/** Allows you to access Nuclia accounts and/or Nuclia Knowledge Boxes. */
export class Db implements IDb {
  private nuclia: INuclia;
  private useRegionalSystem =
    location.hostname === 'stashify.cloud' || localStorage.getItem('NUCLIA_NEW_REGIONAL_ENDPOINTS') === 'true';

  public constructor(nuclia: INuclia) {
    this.nuclia = nuclia;
  }

  /** Returns a list of all the accounts which are accessible for the current authenticated user. */
  getAccounts(): Observable<Account[]> {
    return this.nuclia.rest.get<Account[]>('/accounts');
  }

  /**
   * Returns a list of all the KB indexes (account id, kb id, zone id) for the provided account slug.
   * @param accountSlug
   */
  getKbIndexes(accountSlug: string): Observable<KbIndex[]> {
    return this.nuclia.rest.get<KbIndex[]>(`/account/${accountSlug}/index/kbs`);
  }

  /** Creates a new account. */
  createAccount(account: AccountCreation): Observable<Account> {
    return this.nuclia.rest.post<Account>('/accounts', account);
  }

  /**
   * Modifies account properties.
   *
   * Example:
    ```ts
    nuclia.db.modifyAccount('my-account', { title: 'My account' }).subscribe({
      next: () => {
        console.log('account modified');
      },
      error: (error) => {
        console.error(error);
      },
    });
    ```
  */
  modifyAccount(account: string, data: Partial<Account>): Observable<void> {
    return this.nuclia.rest.patch<void>(`/account/${account}`, data);
  }

  /** Deletes an account. */
  deleteAccount(account: string): Observable<void> {
    return this.nuclia.rest.delete(`/account/${account}`);
  }

  /**
   * Returns account status.
   *
   * Example:
    ```ts
    nuclia.db
      .getAccountStatus('my-account')
      .pipe(filter((status) => status.available))
      .subscribe((status) => {
        console.log('account ready');
      });
    ```
   */
  getAccountStatus(account: string): Observable<AccountStatus> {
    return this.nuclia.rest.get<AccountStatus>(`/account/${account}/status`);
  }

  /**
   * Returns user information.
   *
   * Example:
    ```ts
    nuclia.db.getWelcome().subscribe((welcome) => {
      console.log(`Welcome ${welcome.preferences.name}`);
    });
    ```
  */
  getWelcome(): Observable<Welcome> {
    return this.nuclia.rest.get<Welcome>('/user/welcome');
  }

  /**
   * Returns the account with the given slug, or the one defined in the Nuclia options
   * if no slug is provided.
   */
  getAccount(): Observable<Account>;
  getAccount(account?: string): Observable<Account> {
    account = account || this.nuclia.options.account;
    if (!account) {
      throw new Error('Account is not set');
    }
    return this.nuclia.rest.get<Account>(`/account/${account}`);
  }

  getStandaloneKbs(): Observable<IStandaloneKb[]> {
    return this.nuclia.rest.get<{ kbs: IStandaloneKb[] }>('/kbs').pipe(map((result) => result.kbs));
  }

  /** Returns a list of all the Knowledge Boxes for the given account slug. */
  getKnowledgeBoxes(accountSlug: string): Observable<IKnowledgeBoxItem[]> {
    const accountId = this.nuclia.options.accountId;
    if (this.useRegionalSystem && !accountId) {
      console.error('Account ID must be set in Nuclia options in order to load KBs using regional system');
    }
    return this.useRegionalSystem && accountId
      ? forkJoin([this.nuclia.rest.getZones(), this.getKbIndexes(accountSlug)]).pipe(
          switchMap(([zoneMap, indexes]) => {
            const zones = indexes.reduce((zoneIds, index) => {
              const zoneSlug = zoneMap[index.zone_id];
              if (!zoneIds.includes(zoneSlug)) {
                zoneIds.push(zoneSlug);
              }
              return zoneIds;
            }, [] as string[]);
            return zones.length > 0
              ? forkJoin(zones.map((zone) => this.getKnowledgeBoxesForZone(accountId, zone)))
              : of([]);
          }),
          map((kbByZone) =>
            kbByZone.reduce((kbList, list) => {
              return kbList.concat(list);
            }, [] as IKnowledgeBoxItem[]),
          ),
        )
      : this.nuclia.rest.get<IKnowledgeBoxItem[]>(`/account/${accountSlug}/kbs`);
  }

  getKnowledgeBoxesForZone(accountId: string, zone: string): Observable<IKnowledgeBoxItem[]> {
    return this.nuclia.rest.get<IKnowledgeBoxItem[]>(`/account/${accountId}/kbs`, undefined, undefined, zone);
  }

  /**
   * Returns the Knowledge Box with the given slug, or the one defined in the Nuclia options
   * if no slug is provided.
   */
  getKnowledgeBox(): Observable<WritableKnowledgeBox>;
  getKnowledgeBox(account: string, knowledgeBox: string): Observable<WritableKnowledgeBox>;
  getKnowledgeBox(account?: string, knowledgeBox?: string): Observable<WritableKnowledgeBox> {
    if (this.useRegionalSystem) {
      const accountId = this.nuclia.options.accountId;
      if (accountId) {
        // TODO use knowledgeBox param if defined, once old system will be cleaned up (rename to knowledgeBoxId to make it explicit)
        // get kb slug from nuclia options for standalone case
        const kbId = this.nuclia.options.knowledgeBox;
        const kbSlug = knowledgeBox || this.nuclia.options.kbSlug;
        if (!kbId) {
          throw new Error('knowledgeBox id must be defined in the Nuclia options');
        }

        const kbEndpoint = this.nuclia.options.standalone ? `/kb/${kbSlug}` : `/account/${accountId}/kb/${kbId}`;

        return this.nuclia.rest
          .get<IKnowledgeBox>(
            kbEndpoint,
            undefined,
            undefined,
            this.nuclia.options.standalone || this.nuclia.options.proxy ? undefined : this.nuclia.options.zone,
          )
          .pipe(map((kb) => new WritableKnowledgeBox(this.nuclia, account as string, kb)));
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
    } else {
      account = account || this.nuclia.options.account;
      if (account) {
        const knowledgeBoxSlug = knowledgeBox || this.nuclia.options.knowledgeBox || this.nuclia.options.kbSlug;
        if (!knowledgeBoxSlug) {
          throw new Error('account and knowledgeBox must be defined in the Nuclia options');
        }

        const kbEndpoint = this.nuclia.options.standalone
          ? `/kb/${knowledgeBoxSlug}`
          : `/account/${account}/kb/${knowledgeBoxSlug}`;
        return this.nuclia.rest.get<IKnowledgeBox>(kbEndpoint).pipe(
          switchMap((kb) =>
            this.nuclia.options.zone || this.nuclia.options.standalone || this.nuclia.options.proxy
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
  }

  /**
   * Creates a new Knowledge Box.
   *
   * Example:
    ```ts
    const knowledgeBox = {
      slug: 'my-kb',
      title: 'My knowledge box',
    };
    nuclia.db.createKnowledgeBox('my-account', knowledgeBox).subscribe((knowledgeBox) => {
      console.log('knowledge box', knowledgeBox);
    });
    ```
  */
  createKnowledgeBox(account: string, knowledgeBox: KnowledgeBoxCreation): Observable<WritableKnowledgeBox> {
    const creation: Observable<IKnowledgeBox> = this.useRegionalSystem
      ? this.nuclia.rest.post<IKnowledgeBox>(
          `/account/${this.nuclia.options.accountId}/kbs`,
          knowledgeBox,
          undefined,
          undefined,
          undefined,
          this.nuclia.options.zone,
        )
      : this.nuclia.rest.post<IKnowledgeBox>(
          this.nuclia.options.standalone ? '/kbs' : `/account/${account}/kbs`,
          knowledgeBox,
        );
    return creation.pipe(
      switchMap((res) => {
        const id = res.id || res.uuid;
        if (!id) {
          throw 'KnowledgeBox creation failed';
        }
        // TODO: once old endpoints will be cleaned up, we should pass the KB id directly to getKnowledgeBox
        // set the created KB Id in nuclia options, so we can properly getKnowledgeBox afterward
        this.nuclia.options.knowledgeBox = id;
        return this.getKnowledgeBox(account, this.nuclia.options.standalone ? id : knowledgeBox.slug);
      }),
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

  /**
   * Uploads and pushes a file to Nuclia Understanding API.
   *
   * _Requires a NUA token._
   *
   * Example:

    ```ts
    const file = input.files[0];
    nuclia.db.upload(file).subscribe({
    next: (response) => {
      console.log('file uploaded', response);
    },
    error: (error) => {
      console.error(error);
    },
    });
    ```
   */
  upload(file: FileWithMetadata): Observable<ProcessingPushResponse> {
    if (!this.hasNUAClient()) {
      throw new Error('NUA key is needed to be able to call /process');
    }
    return uploadToProcess(this.nuclia, this.getNUAKey(), file, { md5: file.md5 }).pipe(
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

  /**
   * Pulls the latest data from Nuclia Understanding API.
   *
   * _Requires a NUA token._
   */
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

  getNUAActivity(accountId: string, client_id: string, zoneSlug: string, pageIndex = 0): Observable<EventList> {
    return this.nuclia.rest.get<EventList>(
      `/account/${accountId}/nua_client/${client_id}/activity?page=${pageIndex}`,
      undefined,
      undefined,
      zoneSlug,
    );
  }

  getNUAClients(account: string): Observable<NUAClient[]> {
    if (this.useRegionalSystem) {
      return this.nuclia.rest.getZones().pipe(
        switchMap((zones) =>
          forkJoin(
            Object.values(zones).map((zoneSlug) =>
              this.nuclia.rest
                .get<{ clients: NUAClient[] }>(`/account/${account}/nua_clients`, undefined, undefined, zoneSlug)
                .pipe(
                  map(({ clients }) => clients.map((client) => ({ ...client, zone: zoneSlug }) as NUAClient)),
                  catchError(() => of([] as NUAClient[])),
                ),
            ),
          ),
        ),
        map((response) =>
          response.reduce((allClients, clients) => {
            return allClients.concat(clients);
          }, [] as NUAClient[]),
        ),
      );
    } else {
      return this.nuclia.rest
        .get<{ clients: NUAClient[] }>(`/account/${account}/nua_clients`)
        .pipe(map((res) => res.clients));
    }
  }

  getNUAClient(account: string, client_id: string): Observable<NUAClient> {
    // FIXME: once new regional system will be in place, we'll need account id instead of slug, and we'll need the zone
    return this.nuclia.rest.get<NUAClient>(`/account/${account}/nua_client/${client_id}`);
  }

  hasNUAClient(): boolean {
    return !!this.getNUAKey();
  }

  getNUAKey(): string {
    return this.nuclia.options.nuaKey || '';
  }

  getNUAHeader(): { 'x-nuclia-nuakey': string } {
    return {
      'x-nuclia-nuakey': `Bearer ${this.getNUAKey()}`,
    };
  }

  /** Creates a NUA client and a NUA token. */
  createNUAClient(account: string, data: NUAClientPayload): Observable<{ client_id: string; token: string }>;
  createNUAClient(
    accountId: string,
    data: NUAClientPayload,
    zone: string,
  ): Observable<{ client_id: string; token: string }>;
  createNUAClient(
    account?: string,
    data?: NUAClientPayload,
    zone?: string,
  ): Observable<{ client_id: string; token: string }> {
    if (!account || !data) {
      const error = 'Account and data are required to create a NUA client';
      console.error(error);
      return throwError(() => error);
    }

    const payload: NUAClientPayload & { processing_webhook?: { uri: string } } = { ...data };
    if (payload.webhook) {
      payload.processing_webhook = { uri: payload.webhook };
      delete payload.webhook;
    }

    return this.nuclia.rest
      .post<{ client_id: string; token: string }>(
        `/account/${account}/nua_clients`,
        payload,
        undefined,
        undefined,
        undefined,
        zone,
      )
      .pipe(
        catchError((err) => {
          if (err.status === 409 && data.client_id) {
            return this.renewNUAClient(account, data.client_id);
          } else {
            throw err;
          }
        }),
        tap((key) => {
          if (this.nuclia.options.client === 'desktop') {
            this.nuclia.options.nuaKey = key.token;
            localStorage.setItem(NUA_KEY, key.token);
          }
        }),
      );
  }

  /** Renews a NUA token. */
  renewNUAClient(account: string, client_id: string): Observable<{ client_id: string; token: string }>;
  renewNUAClient(accountId: string, client_id: string, zone: string): Observable<{ client_id: string; token: string }>;
  renewNUAClient(
    account?: string,
    client_id?: string,
    zone?: string,
  ): Observable<{ client_id: string; token: string }> {
    return this.nuclia.rest.put<{ client_id: string; token: string }>(
      `/account/${account}/nua_client/${client_id}/key`,
      {},
      undefined,
      undefined,
      undefined,
      zone,
    );
  }

  /** Deletes a NUA client. */
  deleteNUAClient(account: string, client_id: string): Observable<void>;
  deleteNUAClient(accountId: string, client_id: string, zone: string): Observable<void>;
  deleteNUAClient(account?: string, client_id?: string, zone?: string): Observable<void> {
    return this.nuclia.rest.delete(`/account/${account}/nua_client/${client_id}`, undefined, undefined, zone);
  }

  getLearningConfigurations(): Observable<LearningConfigurations> {
    return this.nuclia.rest.get<LearningConfigurations>('/learning/configuration/schema');
  }

  predictTokens(text: string): Observable<PredictedToken[]> {
    if (!this.hasNUAClient()) {
      throw new Error('NUA key is needed to be able to call /predict');
    }
    return this.nuclia.rest
      .get<{
        tokens: PredictedToken[];
        time: number;
      }>(`/predict/tokens?text=${encodeURIComponent(text)}`, this.getNUAHeader())
      .pipe(map((response) => response.tokens));
  }

  predictAnswer(question: string, context: string[], model?: string): Observable<string> {
    if (!this.hasNUAClient()) {
      throw new Error('NUA key is needed to be able to call /predict');
    }
    const modelParam = model ? `?model=${encodeURIComponent(model)}` : '';
    return this.nuclia.rest
      .post<Response>(
        `/predict/chat${modelParam}`,
        {
          question,
          user_id: 'Anonymous',
          query_context: context,
        },
        this.getNUAHeader(),
        true,
      )
      .pipe(
        concatMap((res) => from(res.text())),
        map((answer) => answer.slice(0, -1)),
      );
  }

  /**
   * Get an account user by their id
   * @param accountSlug
   * @param userId
   */
  getAccountUser(accountSlug: string, userId: string): Observable<Partial<FullAccountUser>> {
    return this.nuclia.rest.get(`/account/${accountSlug}/user/${userId}`);
  }

  /**
   * Get the list of all users of an account
   * @param accountSlug
   */
  getAccountUsers(accountSlug: string): Observable<FullAccountUser[]> {
    return this.nuclia.rest.get(`/account/${accountSlug}/users`);
  }

  /**
   * Add and/or delete users from an account
   * @param accountSlug
   * @param users
   */
  setAccountUsers(accountSlug: string, users: AccountUsersPayload): Observable<void> {
    const url = `/account/${accountSlug}/users`;
    return this.nuclia.rest.patch(url, users);
  }

  /**
   * Invite a user to an account
   * @param accountSlug
   * @param data
   */
  inviteToAccount(accountSlug: string, data: InviteAccountUserPayload): Observable<void> {
    const url = `/account/${accountSlug}/invite`;
    return this.nuclia.rest.post(url, data);
  }
}
