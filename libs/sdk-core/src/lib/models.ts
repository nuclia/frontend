import type { Observable } from 'rxjs';
import type { AuthTokens, JwtUser, NucliaDBRole } from './auth';
import {
  Account,
  AccountCreation,
  AccountModification,
  AccountStatus,
  AccountTypes,
  EventList,
  IKnowledgeBoxItem,
  IRetrievalAgentItem,
  IStandaloneKb,
  KbIndex,
  KBRoles,
  KnowledgeBox,
  KnowledgeBoxCreation,
  LearningConfigurations,
  NUAClient,
  NUAClientPayload,
  PredictedToken,
  ProcessingPullResponse,
  ProcessingPushResponse,
  QueryInfo,
  UsageAggregation,
  UsagePoint,
  Welcome,
  WritableKnowledgeBox,
} from './db';

export interface INuclia {
  options: NucliaOptions;
  auth: IAuthentication;
  rest: IRest;
  db: IDb;
  events?: IEvents;
  get backend(): string;
  get regionalBackend(): string;
  get knowledgeBox(): KnowledgeBox;
}

export interface IEvents {
  emit<T = any>(eventName: string, data: T): void;
  on<T = any>(eventName: string): Observable<T>;
  log(eventName: string, data: any): void;
  dump(): Observable<{ [name: string]: any }>;
}

export interface IAuthentication {
  isAuthenticated(): Observable<boolean>;
  hasLoggedOut(): Observable<boolean>;
  login(username: string, password: string, validation?: string): Observable<boolean>;
  logout(): void;
  getAuthHeaders(): { [key: string]: string };
  getAuthHeaders(method: string, path: string): { [key: string]: string };
  getToken(force?: boolean): string;
  getRefreshToken(): string;
  authenticate(tokens: AuthTokens): boolean;
  setPassword(password: string): Observable<boolean>;
  deleteAuthenticatedUser(): Observable<void>;
  getJWTUser(): JwtUser | null;
}

export interface IRest {
  get<T>(
    path: string,
    extraHeaders?: { [key: string]: string },
    doNotParse?: boolean,
    zoneSlug?: string,
  ): Observable<T>;
  post<T>(
    path: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body: any,
    extraHeaders?: { [key: string]: string },
    doNotParse?: boolean,
    synchronous?: boolean,
    zoneSlug?: string,
  ): Observable<T>;
  put<T>(
    path: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body: any,
    extraHeaders?: { [key: string]: string },
    doNotParse?: boolean,
    synchronous?: boolean,
    zoneSlug?: string,
  ): Observable<T>;
  patch<T>(
    path: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body: any,
    extraHeaders?: { [key: string]: string },
    doNotParse?: boolean,
    synchronous?: boolean,
    zoneSlug?: string,
  ): Observable<T>;
  delete(
    path: string,
    extraHeaders?: { [key: string]: string },
    synchronous?: boolean,
    zoneSlug?: string,
  ): Observable<void>;
  head(path: string, extraHeaders?: { [key: string]: string }): Observable<Response>;
  getZones(): Observable<{ [key: string]: string }>;
  getZoneSlug(zoneId: string): Observable<string>;
  getFullUrl(path: string): string;
  getObjectURL(path: string): Observable<string>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getStreamedResponse(path: string, body: any): Observable<{ data: Uint8Array; incomplete: boolean; headers: Headers }>;

  getStreamMessages(path: string, controller: AbortController): Observable<{ data: Uint8Array; headers: Headers }>;
  checkAuthorization(path: string): Observable<{ allowed: boolean; roles: (KBRoles | NucliaDBRole)[] }>;

  getHeaders(
    method: string,
    path: string,
    extraHeaders?: { [key: string]: string },
    synchronous?: boolean,
  ): {
    [key: string]: string;
  };
}
export interface IDb {
  getAccounts(): Observable<Account[]>;
  getKbIndexes(accountSlug: string): Observable<KbIndex[]>;
  createAccount(account: AccountCreation): Observable<Account>;
  getAccountStatus(accountSlug: string): Observable<AccountStatus>;
  modifyAccount(accountSlug: string, data: AccountModification): Observable<void>;
  deleteAccount(accountSlug: string): Observable<void>;
  getWelcome(): Observable<Welcome>;
  getAccount(): Observable<Account>;
  getAccount(accountIdOrSlug?: string): Observable<Account>;
  getStandaloneKbs(): Observable<IStandaloneKb[]>;
  getKnowledgeBoxes(): Observable<IKnowledgeBoxItem[]>;
  getKnowledgeBoxes(accountSlug: string, accountId: string): Observable<IKnowledgeBoxItem[]>;
  getKnowledgeBoxesForZone(accountId: string, zone: string): Observable<IKnowledgeBoxItem[]>;
  getKnowledgeBox(): Observable<WritableKnowledgeBox>;
  getKnowledgeBox(accountId: string, knowledgeBoxId: string, zone?: string): Observable<WritableKnowledgeBox>;
  createKnowledgeBox(
    accountId: string,
    knowledgeBox: KnowledgeBoxCreation,
    zone?: string,
  ): Observable<WritableKnowledgeBox>;
  getRetrievalAgents(): Observable<IRetrievalAgentItem[]>;
  getRetrievalAgents(accountSlug: string, accountId: string): Observable<IRetrievalAgentItem[]>;
  getRetrievalAgentsForZone(accountId: string, zone: string): Observable<IRetrievalAgentItem[]>;
  getUsage(
    accountId: string,
    from: string,
    to?: string,
    knowledgeBox?: string,
    aggregation?: UsageAggregation,
  ): Observable<UsagePoint[]>;
  upload(file: File): Observable<ProcessingPushResponse>;
  pull(): Observable<ProcessingPullResponse>;
  getNUAClients(accountId: string): Observable<NUAClient[]>;
  getNUAClient(accountId: string, client_id: string, zone: string): Observable<NUAClient>;
  createNUAClient(accountId: string, data: NUAClientPayload): Observable<{ client_id: string; token: string }>;
  createNUAClient(
    accountId: string,
    data: NUAClientPayload,
    zone: string,
  ): Observable<{ client_id: string; token: string }>;
  renewNUAClient(accountId: string, client_id: string): Observable<{ client_id: string; token: string }>;
  renewNUAClient(accountId: string, client_id: string, zone: string): Observable<{ client_id: string; token: string }>;
  deleteNUAClient(accountId: string, client_id: string): Observable<void>;
  deleteNUAClient(accountId: string, client_id: string, zone: string): Observable<void>;
  hasNUAClient(): boolean;
  getNUAActivity(accountId: string, client_id: string, zoneSlug: string, pageIndex?: number): Observable<EventList>;
  getLearningSchema(): Observable<LearningConfigurations>;
  getLearningSchema(accountId: string, zone: string): Observable<LearningConfigurations>;
  predictTokens(text: string): Observable<PredictedToken[]>;
  predictAnswer(question: string, context: string[], model?: string): Observable<string>;
  predictQuery(text: string, rephrase?: boolean, model?: string, rephrase_prompt?: string): Observable<QueryInfo>;
  predictSummarize(
    text: string,
    user_prompt?: string,
    model?: string,
    summary_kind?: 'simple' | 'extended',
  ): Observable<string>;
  getAccountUser(accountSlug: string, userId: string): Observable<Partial<FullAccountUser>>;
  getAccountUsers(accountSlug: string): Observable<FullAccountUser[]>;
  setAccountUsers(accountSlug: string, users: AccountUsersPayload): Observable<void>;
  inviteToAccount(accountSlug: string, data: InviteAccountUserPayload): Observable<void>;
  getAccountInvitations(accountId: string): Observable<PendingInvitation[]>;
  deleteAccountInvitation(accountId: string, email: string): Observable<void>;
}

export interface NucliaOptions {
  /**
   * The Nuclia backend to use.
   *
   * Example: `https://nuclia.cloud/api` */
  backend: string;
  /**
   * The geographical zone for the regional API calls.
   *
   * Example: `europe-1` */
  zone?: string;
  /**
   * Allows you to make calls to a private Knowledge Box.
   *
   * It can be used in a server-side app, but never in a web app.
   */
  apiKey?: string;
  /**
   * Allows you to make calls the NUA processing.
   */
  nuaKey?: string;
  /**
   * The Nuclia account slug.
   *
   * Example: `my-account`
   */
  account?: string;
  accountType?: AccountTypes;
  /**
   * The Nuclia account id.
   */
  accountId?: string;
  /**
   * The Nuclia Knowledge Box unique id.
   *
   * Example: `17815eb2-06a5-40ee-a5aa-b2f9dbc5da70` */
  knowledgeBox?: string;
  /**
   * The Knowledge Box slug.
   *
   * Example: `my-kb` */
  kbSlug?: string;
  client?: string;
  /** Indicates if you are using a local NucliaDB instance. */
  standalone?: boolean;
  /** Indicates if you are using a proxy. */
  proxy?: boolean;
  /**
   * Indicates if the Knowledge Box is public or not.
   *
   * Set it to `false` when using a private Knowledge Box.
   */
  public?: boolean;
  /**
   * Allow to modify the headers for the REST calls.
   */
  modifyHeaders?: (headers: { [key: string]: string }) => { [key: string]: string };
}

export type PromiseMapper<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => Observable<infer V> ? (...args: A) => Promise<V> : T[K];
};

export interface IErrorResponse {
  status: number;
  detail: string;
  type: 'error';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body?: any;
}
export type AccountRoles = 'AOWNER' | 'AMEMBER';
export interface FullAccountUser {
  id: string;
  name: string;
  email: string;
  role: AccountRoles;
}

export interface AccountUser {
  id: string;
  role: AccountRoles;
}

export interface AccountUsersPayload {
  add?: AccountUser[];
  delete?: string[];
}

export interface InviteAccountUserPayload {
  email: string;
  role?: AccountRoles;
}

export interface PendingInvitation {
  email: string;
  role: AccountRoles;
  expires: string;
}
