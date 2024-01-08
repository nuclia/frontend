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
  modifyAccount(accountSlug: string, data: Partial<Account>): Observable<void> {
    return this.nuclia.rest.patch<void>(`/account/${accountSlug}`, data);
  }

  /** Deletes an account. */
  deleteAccount(accountSlug: string): Observable<void> {
    return this.nuclia.rest.delete(`/account/${accountSlug}`);
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
  getAccountStatus(accountSlug: string): Observable<AccountStatus> {
    return this.nuclia.rest.get<AccountStatus>(`/account/${accountSlug}/status`);
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

  /**
   * Returns a list of all the Knowledge Boxes for the given account. Account slug and id can be provided in the Nuclia options or as parameters.
   */
  getKnowledgeBoxes(): Observable<IKnowledgeBoxItem[]>;
  getKnowledgeBoxes(accountSlug: string, accountId: string): Observable<IKnowledgeBoxItem[]>;
  getKnowledgeBoxes(accountSlug?: string, accountId?: string): Observable<IKnowledgeBoxItem[]> {
    const slug = accountSlug || this.nuclia.options.account;
    const id = accountId || this.nuclia.options.accountId;
    if (!slug || !id) {
      return throwError(
        () =>
          'Account slug and ID must be provided in order to load KBs. You can provide them as parameter or in Nuclia options.',
      );
    }
    return forkJoin([this.nuclia.rest.getZones(), this.getKbIndexes(slug)]).pipe(
      switchMap(([zoneMap, indexes]) => {
        const zones = indexes.reduce((zoneIds, index) => {
          const zoneSlug: string = zoneMap[index.zone_id];
          if (!zoneIds.includes(zoneSlug)) {
            zoneIds.push(zoneSlug);
          }
          return zoneIds;
        }, [] as string[]);
        return zones.length > 0 ? forkJoin(zones.map((zone) => this.getKnowledgeBoxesForZone(id, zone))) : of([]);
      }),
      map((kbByZone) =>
        kbByZone.reduce((kbList, list) => {
          return kbList.concat(list);
        }, [] as IKnowledgeBoxItem[]),
      ),
    );
  }

  /**
   * Returns the list of Knowledge Boxes for the given account id and zone.
   * @param accountId
   * @param zone
   */
  getKnowledgeBoxesForZone(accountId: string, zone: string): Observable<IKnowledgeBoxItem[]> {
    return this.nuclia.rest.get<IKnowledgeBoxItem[]>(`/account/${accountId}/kbs`, undefined, undefined, zone);
  }

  /**
   * Returns the Knowledge Box corresponding to the account id, Knowledge Box id and zone provided as parameters or the ones defined in the Nuclia options
   * if no parameters are provided.
   * Zone is mandatory except if the Knowledge Box is from a local NucliaDB instance.
   */
  getKnowledgeBox(): Observable<WritableKnowledgeBox>;
  getKnowledgeBox(accountId: string, knowledgeBoxId: string, zone?: string): Observable<WritableKnowledgeBox>;
  getKnowledgeBox(accountId?: string, knowledgeBoxId?: string, zone?: string): Observable<WritableKnowledgeBox> {
    const accountID = accountId || this.nuclia.options.accountId;
    const kbId = knowledgeBoxId || this.nuclia.options.knowledgeBox;
    const zoneSlug = zone || this.nuclia.options.zone;

    if (accountID || this.nuclia.options.standalone) {
      if (!this.nuclia.options.standalone && !this.nuclia.options.proxy && (!kbId || !zoneSlug)) {
        throw new Error('Knowledge Box id and zone must be provided as parameters or in the Nuclia options');
      }

      const kbEndpoint = this.nuclia.options.standalone ? `/kb/${kbId}` : `/account/${accountID}/kb/${kbId}`;

      return this.nuclia.rest
        .get<IKnowledgeBox>(
          kbEndpoint,
          undefined,
          undefined,
          this.nuclia.options.standalone || this.nuclia.options.proxy ? undefined : zoneSlug,
        )
        .pipe(map((kb) => new WritableKnowledgeBox(this.nuclia, accountID as string, kb)));
    } else {
      if ((!this.nuclia.options.knowledgeBox && !kbId) || (!this.nuclia.options.zone && !zone)) {
        throw new Error('Knowledge Box id and zone must be provided as parameters or in the Nuclia options');
      }
      return of(
        new WritableKnowledgeBox(this.nuclia, '', {
          id: knowledgeBoxId || (this.nuclia.options.knowledgeBox as string),
          zone: zone || (this.nuclia.options.zone as string),
        }),
      );
    }
  }

  /**
   * Creates a new Knowledge Box.
   * Zone parameter is mandatory except if the Knowledge Box is from a local NucliaDB instance.
   * Example:
    ```ts
    const knowledgeBox = {
      slug: 'my-kb',
      title: 'My knowledge box',
    };
    nuclia.db.createKnowledgeBox('my-account-id', 'europe-1', knowledgeBox).subscribe((knowledgeBox) => {
      console.log('knowledge box', knowledgeBox);
    });
    ```
  */
  createKnowledgeBox(
    accountId: string,
    knowledgeBox: KnowledgeBoxCreation,
    zone?: string,
  ): Observable<WritableKnowledgeBox> {
    let creation: Observable<IKnowledgeBox>;
    if (this.nuclia.options.standalone) {
      creation = this.nuclia.rest.post<IKnowledgeBox>('/kbs', knowledgeBox);
    } else {
      creation = this.nuclia.rest.post<IKnowledgeBox>(
        `/account/${accountId}/kbs`,
        knowledgeBox,
        undefined,
        undefined,
        undefined,
        zone,
      );
    }
    return creation.pipe(
      switchMap((res) => {
        const id = res.id || res.uuid;
        if (!id) {
          throw 'Knowledge Box creation failed';
        }
        return this.getKnowledgeBox(accountId, id, zone);
      }),
    );
  }

  getStats(
    accountSlug: string,
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
    return this.nuclia.rest.get<{ data: ProcessingStat[] }>(`/account/${accountSlug}/stats?${params.join('&')}`).pipe(
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

  getNUAClients(accountId: string): Observable<NUAClient[]> {
    return this.nuclia.rest.getZones().pipe(
      switchMap((zones) =>
        forkJoin(
          Object.values(zones).map((zoneSlug) =>
            this.nuclia.rest
              .get<{ clients: NUAClient[] }>(`/account/${accountId}/nua_clients`, undefined, undefined, zoneSlug)
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
  }

  getNUAClient(accountId: string, client_id: string, zone: string): Observable<NUAClient> {
    return this.nuclia.rest.get<NUAClient>(`/account/${accountId}/nua_client/${client_id}`, undefined, undefined, zone);
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

  /**
   * Creates a NUA client and a NUA token.
   * Zone parameter must be provided except when working with a local NucliaDB instance.
   * @param accountId Account identifier
   * @param data NUA client data
   */
  createNUAClient(accountId: string, data: NUAClientPayload): Observable<{ client_id: string; token: string }>;
  createNUAClient(
    accountId: string,
    data: NUAClientPayload,
    zone: string,
  ): Observable<{ client_id: string; token: string }>;
  createNUAClient(
    accountId?: string,
    data?: NUAClientPayload,
    zone?: string,
  ): Observable<{ client_id: string; token: string }> {
    if (!accountId || !data) {
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
        `/account/${accountId}/nua_clients`,
        payload,
        undefined,
        undefined,
        undefined,
        zone,
      )
      .pipe(
        catchError((err) => {
          if (err.status === 409 && data.client_id) {
            return this.renewNUAClient(accountId, data.client_id);
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

  /**
   *  Renews a NUA token.
   *  Zone parameter must be provided except when working with a local NucliaDB instance.
   */
  renewNUAClient(accountId: string, client_id: string): Observable<{ client_id: string; token: string }>;
  renewNUAClient(accountId: string, client_id: string, zone: string): Observable<{ client_id: string; token: string }>;
  renewNUAClient(
    accountId?: string,
    client_id?: string,
    zone?: string,
  ): Observable<{ client_id: string; token: string }> {
    return this.nuclia.rest.put<{ client_id: string; token: string }>(
      `/account/${accountId}/nua_client/${client_id}/key`,
      {},
      undefined,
      undefined,
      undefined,
      zone,
    );
  }

  /**
   * Deletes a NUA client.
   * Zone parameter must be provided except when working with a local NucliaDB instance.
   */
  deleteNUAClient(accountId: string, client_id: string): Observable<void>;
  deleteNUAClient(accountId: string, client_id: string, zone: string): Observable<void>;
  deleteNUAClient(accountId?: string, client_id?: string, zone?: string): Observable<void> {
    return this.nuclia.rest.delete(`/account/${accountId}/nua_client/${client_id}`, undefined, undefined, zone);
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
