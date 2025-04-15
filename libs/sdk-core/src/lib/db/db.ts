import {
  catchError,
  concatMap,
  defer,
  forkJoin,
  from,
  map,
  Observable,
  of,
  retry,
  RetryConfig,
  switchMap,
  tap,
  throwError,
  timer,
} from 'rxjs';
import {
  AccountUsersPayload,
  FullAccountUser,
  IDb,
  INuclia,
  InviteAccountUserPayload,
  PendingInvitation,
} from '../models';
import {
  Account,
  AccountCreation,
  AccountModification,
  AccountStatus,
  KbIndex,
  LearningConfigurations,
  normalizeSchemaProperty,
  NUA_KEY,
  NUAClient,
  NUAClientPayload,
  PredictedToken,
  ProcessingPullResponse,
  ProcessingPushResponse,
  QueryInfo,
  UsageAggregation,
  UsagePoint,
  Welcome,
} from './db.models';
import type {
  EventList,
  IKnowledgeBoxBase,
  IKnowledgeBoxItem,
  IKnowledgeBoxStandalone,
  KnowledgeBoxCreation,
} from './kb';
import { IStandaloneKb, WritableKnowledgeBox } from './kb';
import { IRetrievalAgentItem, RetrievalAgent } from './retrieval-agent';
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
  modifyAccount(accountSlug: string, data: AccountModification): Observable<void> {
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
   * Returns the account with the given id or slug, or the one defined in the Nuclia options
   * if no id nor slug is provided.
   */
  getAccount(): Observable<Account>;
  getAccount(accountIdOrSlug?: string): Observable<Account> {
    accountIdOrSlug = accountIdOrSlug || this.nuclia.options.account;
    if (!accountIdOrSlug) {
      throw new Error('Account is not set');
    }
    return this.nuclia.rest.get<Account>(`/account/${accountIdOrSlug}`);
  }

  getStandaloneKbs(): Observable<IStandaloneKb[]> {
    return this.nuclia.rest.get<{ kbs: IStandaloneKb[] }>('/kbs').pipe(map((result) => result.kbs));
  }

  private _getKnowledgeBoxes(
    accountSlug?: string,
    accountId?: string,
    mode: 'kb' | 'agent' = 'kb',
  ): Observable<IKnowledgeBoxItem[]> {
    const slug = accountSlug || this.nuclia.options.account;
    const id = accountId || this.nuclia.options.accountId;
    if (!slug || !id) {
      return throwError(
        () =>
          `Account slug and ID must be provided in order to load ${
            mode === 'kb' ? 'KBs' : 'retrieval agents'
          }. You can provide them as parameter or in Nuclia options.`,
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
        return zones.length > 0
          ? forkJoin(zones.map((zone) => this._getKnowledgeBoxesForZone(id, zone, mode)))
          : of([]);
      }),
      map((kbByZone) =>
        kbByZone.reduce((kbList, list) => {
          return kbList.concat(list);
        }, [] as IKnowledgeBoxItem[]),
      ),
    );
  }

  private _getKnowledgeBoxesForZone(
    accountId: string,
    zone: string,
    mode: 'kb' | 'agent' = 'kb',
  ): Observable<IKnowledgeBoxItem[]> {
    const modeParam = mode === 'agent' ? `?mode=agent` : '';
    return this.nuclia.rest.get<IKnowledgeBoxItem[]>(
      `/account/${accountId}/kbs${modeParam}`,
      undefined,
      undefined,
      zone,
    );
  }

  /**
   * Returns a list of all the Knowledge Boxes for the given account. Account slug and id can be provided in the Nuclia options or as parameters.
   */
  getKnowledgeBoxes(): Observable<IKnowledgeBoxItem[]>;
  getKnowledgeBoxes(accountSlug: string, accountId: string): Observable<IKnowledgeBoxItem[]>;
  getKnowledgeBoxes(accountSlug?: string, accountId?: string): Observable<IKnowledgeBoxItem[]> {
    return this._getKnowledgeBoxes(accountSlug, accountId);
  }

  /**
   * Returns the list of Knowledge Boxes for the given account id and zone.
   * @param accountId
   * @param zone
   */
  getKnowledgeBoxesForZone(accountId: string, zone: string): Observable<IKnowledgeBoxItem[]> {
    return this._getKnowledgeBoxesForZone(accountId, zone);
  }

  /**
   * Returns a list of all the Retrieval Agents for the given account. Account slug and id can be provided in the Nuclia options or as parameters.
   */
  getRetrievalAgents(): Observable<IRetrievalAgentItem[]>;
  getRetrievalAgents(accountSlug: string, accountId: string): Observable<IRetrievalAgentItem[]>;
  getRetrievalAgents(accountSlug?: string, accountId?: string): Observable<IKnowledgeBoxItem[]> {
    return this._getKnowledgeBoxes(accountSlug, accountId, 'agent');
  }

  /**
   * Returns the list of Retrieval Agents for the given account id and zone.
   * @param accountId
   * @param zone
   */
  getRetrievalAgentsForZone(accountId: string, zone: string): Observable<IRetrievalAgentItem[]> {
    // FIXME: we call the one for KB until the one for agent is working on the backend side
    return this._getKnowledgeBoxesForZone(accountId, zone, 'kb'); //this._getKnowledgeBoxesForZone(accountId, zone, 'agent');
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

      const request: Observable<IKnowledgeBoxBase | IKnowledgeBoxStandalone> = this.nuclia.options.standalone
        ? this.nuclia.rest.get<IKnowledgeBoxStandalone>(`/kb/${kbId}`)
        : this.nuclia.rest.get<IKnowledgeBoxBase>(
            `/account/${accountID}/kb/${kbId}`,
            undefined,
            undefined,
            this.nuclia.options.proxy ? undefined : zoneSlug,
          );

      return request.pipe(map((kb) => new WritableKnowledgeBox(this.nuclia, accountID as string, kb)));
    } else {
      if ((!this.nuclia.options.knowledgeBox && !kbId) || (!this.nuclia.options.zone && !zone)) {
        throw new Error('Knowledge Box id and zone must be provided as parameters or in the Nuclia options');
      }
      return of(
        new WritableKnowledgeBox(this.nuclia, '', {
          id: kbId as string,
          zone: zone || (this.nuclia.options.zone as string),
          slug: '',
          title: '',
        }),
      );
    }
  }

  getRetrievalAgent(): Observable<RetrievalAgent>;
  getRetrievalAgent(accountId: string, retrievalAgentId: string, zone?: string): Observable<RetrievalAgent>;
  getRetrievalAgent(accountId?: string, retrievalAgentId?: string, zone?: string): Observable<RetrievalAgent> {
    const accountID = accountId || this.nuclia.options.accountId;
    const raId = retrievalAgentId || this.nuclia.options.knowledgeBox;
    const zoneSlug = zone || this.nuclia.options.zone;

    if (accountID) {
      if (!this.nuclia.options.proxy && (!raId || !zoneSlug)) {
        throw new Error('Retrieval Agent id and zone must be provided as parameters or in the Nuclia options');
      }
      const request = this.nuclia.rest.get<IKnowledgeBoxBase>(
        `/account/${accountID}/kb/${raId}`,
        undefined,
        undefined,
        this.nuclia.options.proxy ? undefined : zoneSlug,
      );

      return request.pipe(map((kb) => new RetrievalAgent(this.nuclia, accountID as string, kb)));
    } else {
      if ((!this.nuclia.options.knowledgeBox && !raId) || (!this.nuclia.options.zone && !zone)) {
        throw new Error('Retrieval Agent id and zone must be provided as parameters or in the Nuclia options');
      }
      return of(
        new RetrievalAgent(this.nuclia, '', {
          id: raId as string,
          zone: zone || (this.nuclia.options.zone as string),
          slug: '',
          title: '',
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
    let creation: Observable<string>;
    if (this.nuclia.options.standalone) {
      creation = this.nuclia.rest.post<IKnowledgeBoxStandalone>('/kbs', knowledgeBox).pipe(map((res) => res.uuid));
    } else {
      creation = this.nuclia.rest
        .post<IKnowledgeBoxBase>(`/account/${accountId}/kbs`, knowledgeBox, undefined, undefined, undefined, zone)
        .pipe(map((res) => res.id));
    }
    return creation.pipe(
      switchMap((id) => {
        if (!id) {
          throw 'Knowledge Box creation failed';
        }
        return this.getKnowledgeBox(accountId, id, zone);
      }),
    );
  }

  /**
   * Get usage metric for the account.
   * @param accountId Account identifier
   * @param from Timestamp of the moment from which we want the metrics.
   * @param to Timestamp of the moment until which we want the metrics. When not provided, the metrics are returned "until now".
   * @param knowledgeBoxId Knowledge Box identifier to get the metrics for a specific Knowledge Box (returns the metrics aggregated for all the Knowledge Boxes of the account by default)
   * @param aggregation Define how the metrics are aggregated. By default, the endpoint returns only one point aggregating all the data for the specified date range. But you can have one point by:
   * - "hour"
   * - "day"
   * - "week"
   * - "month"
   * - "quarter"
   * - "year"
   * - "millennium" (used by default)
   */
  getUsage(
    accountId: string,
    from: string,
    to?: string,
    knowledgeBoxId?: string,
    aggregation?: UsageAggregation,
  ): Observable<UsagePoint[]> {
    const params = [`from=${from}`];
    if (to) {
      params.push(`to=${to}`);
    }
    if (knowledgeBoxId) {
      params.push(`knowledgebox=${knowledgeBoxId}`);
    }
    if (aggregation) {
      params.push(`aggregation=${aggregation}`);
    }
    return this.nuclia.rest.get<UsagePoint[]>(`/account/${accountId}/usage?${params.join('&')}`);
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

  /**
   * Get learning configuration schema.
   * When used on Cloud account, this method is requiring account id and zone parameters.
   * When used on standalone, this method doesn't take any parameter
   */
  getLearningSchema(): Observable<LearningConfigurations>;
  getLearningSchema(accountId: string, zone: string): Observable<LearningConfigurations>;
  getLearningSchema(accountId?: string, zone?: string): Observable<LearningConfigurations> {
    const standalone = this.nuclia.options.standalone;
    if (!standalone && (!accountId || !zone)) {
      const error = 'Account id and zone are mandatory to get learning schema for Cloud accounts.';
      console.error(error);
      return throwError(() => error);
    }
    const request = standalone
      ? this.nuclia.rest.get<LearningConfigurations>('/nua/schema')
      : this.nuclia.rest.get<LearningConfigurations>(`/account/${accountId}/schema`, undefined, undefined, zone);
    return request.pipe(map((config) => normalizeSchemaProperty(config)));
  }

  /**
   * Extract NER tokens from a text.
   */
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

  /**
   * Generate an answer from a question and a context.
   */
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
   * Analyse a sentence, returning the language, the entities intent and the embeddings.
   */
  predictQuery(text: string, rephrase?: boolean, model?: string, rephrase_prompt?: string): Observable<QueryInfo> {
    if (!this.hasNUAClient()) {
      throw new Error('NUA key is needed to be able to call /predict');
    }
    let queryParams = `?text=${encodeURIComponent(text)}`;
    if (rephrase) {
      queryParams += `&rephrase=true`;
      if (rephrase_prompt) {
        queryParams += `&rephrase_prompt=${encodeURIComponent(rephrase_prompt)}`;
      }
    }
    if (model) {
      queryParams += `&generative_model=${encodeURIComponent(model)}`;
    }
    return this.nuclia.rest.get<QueryInfo>(`/predict/query${queryParams}`, this.getNUAHeader());
  }

  /**
   * Generate a summary from a text.
   *
   * The optional `user_prompt` parameter allows you to provide a custom prompt to the model,
   * it must use the `{text}` placeholder to indicate where the resource text should be inserted
   * (example: 'Make a one-line summary of the following text: {text}').
   */
  predictSummarize(
    text: string,
    user_prompt?: string,
    model = 'chatgpt-azure-4o',
    summary_kind: 'simple' | 'extended' = 'simple',
  ): Observable<string> {
    if (!this.hasNUAClient()) {
      throw new Error('NUA key is needed to be able to call /predict');
    }
    const modelParam = model ? `?model=${encodeURIComponent(model)}` : '';
    const retryDelays = [0, 1000, 2000, 5000, 10000];
    const retryConfig: RetryConfig = {
      count: retryDelays.length,
      delay: (error, retryCount) => timer(retryDelays[retryCount - 1]),
    };
    return defer(() =>
      this.nuclia.rest.post<{ summary: string }>(
        `/predict/summarize${modelParam}`,
        {
          resources: {
            text: {
              fields: {
                text,
              },
            },
          },
          summary_kind,
          user_prompt,
        },
        this.getNUAHeader(),
      ),
    ).pipe(
      retry(retryConfig),
      map((answer) => answer.summary),
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

  /**
   * List pending account invitations
   * @param accountId
   */
  getAccountInvitations(accountId: string): Observable<PendingInvitation[]> {
    return this.nuclia.rest.get(`/account/${accountId}/invites`);
  }

  /**
   * Delete account invitation
   * @param accountId
   * @param email
   */
  deleteAccountInvitation(accountId: string, email: string): Observable<void> {
    return this.nuclia.rest.delete(`/account/${accountId}/invite/${email}`);
  }
}
