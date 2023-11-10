import type { Observable } from 'rxjs';
import type { AuthTokens, JwtUser } from './auth';
import type {
  Account,
  AccountCreation,
  AccountStatus,
  AccountTypes,
  EventList,
  IKnowledgeBoxItem,
  IStandaloneKb,
  KnowledgeBox,
  KnowledgeBoxCreation,
  LearningConfigurations,
  NUAClient,
  NUAClientPayload,
  PredictedToken,
  ProcessingPullResponse,
  ProcessingPushResponse,
  ProcessingStat,
  ProcessingStatusResponse,
  StatsPeriod,
  StatsRange,
  StatsType,
  Welcome,
  WritableKnowledgeBox,
} from './db';
import { KbIndex } from './db';

export interface INuclia {
  options: NucliaOptions;
  auth: IAuthentication;
  rest: IRest;
  db: IDb;
  events?: IEvents;
  currentShards?: { [kb: string]: string[] };
  get backend(): string;
  get regionalBackend(): string;
  get knowledgeBox(): KnowledgeBox;
}

export interface IEvents {
  emit<T>(eventName: string, data: T): void;
  on<T>(eventName: string): Observable<T>;
}

export interface IAuthentication {
  isAuthenticated(): Observable<boolean>;
  hasLoggedOut(): Observable<boolean>;
  login(username: string, password: string, validation?: string): Observable<boolean>;
  logout(): void;
  getAuthHeaders(): { [key: string]: string };
  getAuthHeaders(method: string, path: string): { [key: string]: string };
  getToken(): string;
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  post<T>(
    path: string,
    body: any,
    extraHeaders?: { [key: string]: string },
    doNotParse?: boolean,
    synchronous?: boolean,
    zoneSlug?: string,
  ): Observable<T>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  put<T>(
    path: string,
    body: any,
    extraHeaders?: { [key: string]: string },
    doNotParse?: boolean,
    synchronous?: boolean,
    zoneSlug?: string,
  ): Observable<T>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  patch<T>(
    path: string,
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
  getStream(path: string, body: any): Observable<{ data: Uint8Array; incomplete: boolean; headers: Headers }>;
}

export interface IDb {
  getAccounts(): Observable<Account[]>;
  getKbIndexes(accountSlug: string): Observable<KbIndex[]>;
  createAccount(account: AccountCreation): Observable<Account>;
  getAccountStatus(account: string): Observable<AccountStatus>;
  modifyAccount(account: string, data: Partial<Account>): Observable<void>;
  deleteAccount(account: string): Observable<void>;
  getWelcome(): Observable<Welcome>;
  getAccount(): Observable<Account>;
  getAccount(account?: string): Observable<Account>;
  getStandaloneKbs(): Observable<IStandaloneKb[]>;
  getKnowledgeBoxes(accountSlug: string): Observable<IKnowledgeBoxItem[]>;
  getKnowledgeBoxesForZone(accountId: string, zone: string): Observable<IKnowledgeBoxItem[]>;
  getKnowledgeBox(): Observable<WritableKnowledgeBox>;
  getKnowledgeBox(account: string, knowledgeBox: string): Observable<WritableKnowledgeBox>;
  createKnowledgeBox(account: string, knowledgeBox: KnowledgeBoxCreation): Observable<WritableKnowledgeBox>;
  getStats(
    account: string,
    type: StatsType,
    knowledgeBox?: string,
    period?: StatsPeriod,
    utctime?: string,
  ): Observable<ProcessingStat[]>;
  upload(file: File): Observable<ProcessingPushResponse>;
  getProcessingStatus(accountId?: string): Observable<ProcessingStatusResponse>;
  getProcessingStats(range?: StatsRange, accountId?: string): Observable<ProcessingStat[]>;
  pull(): Observable<ProcessingPullResponse>;
  getNUAClients(account: string): Observable<NUAClient[]>;
  getNUAClient(account: string, client_id: string): Observable<NUAClient>;
  createNUAClient(account: string, data: NUAClientPayload): Observable<{ client_id: string; token: string }>;
  renewNUAClient(account: string, client_id: string): Observable<{ client_id: string; token: string }>;
  deleteNUAClient(account: string, client_id: string): Observable<void>;
  hasNUAClient(): boolean;
  getNUAActivity(accountSlug: string, client_id: string, pageIndex?: number): Observable<EventList>;
  getLearningConfigurations(): Observable<LearningConfigurations>;
  predictTokens(text: string): Observable<PredictedToken[]>;

  getAccountUser(accountSlug: string, userId: string): Observable<Partial<FullAccountUser>>;
  getAccountUsers(accountSlug: string): Observable<FullAccountUser[]>;
  setAccountUsers(accountSlug: string, users: AccountUsersPayload): Observable<void>;
  inviteToAccount(accountSlug: string, data: InviteAccountUserPayload): Observable<void>;
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
  /**
   * Indicates if the Knowledge Box is public or not.
   *
   * Set it to `false` when using a private Knowledge Box.
   */
  public?: boolean;
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
}
