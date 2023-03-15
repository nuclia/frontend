import type { Observable } from 'rxjs';
import type { AuthTokens, JwtUser } from './auth';
import type {
  Account,
  AccountCreation,
  AccountStatus,
  AccountTypes,
  EventList,
  IKnowledgeBoxItem,
  KnowledgeBox,
  KnowledgeBoxCreation,
  LearningConfigurations,
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
  WritableKnowledgeBox,
} from './db';

export interface INuclia {
  options: NucliaOptions;
  auth: IAuthentication;
  rest: IRest;
  db: IDb;
  currentShards?: { [kb: string]: string[] };
  get backend(): string;
  get regionalBackend(): string;
  get knowledgeBox(): KnowledgeBox;
}

export interface IAuthentication {
  isAuthenticated(): Observable<boolean>;
  hasLoggedOut(): Observable<boolean>;
  login(username: string, password: string, validation?: string): Observable<boolean>;
  logout(): void;
  getAuthHeaders(): { [key: string]: string };
  getToken(): string;
  getRefreshToken(): string;
  authenticate(tokens: AuthTokens): boolean;
  setPassword(password: string): Observable<boolean>;
  deleteAuthenticatedUser(): Observable<void>;
  getJWTUser(): JwtUser | null;
}

export interface IRest {
  get<T>(path: string, extraHeaders?: { [key: string]: string }, doNotParse?: boolean): Observable<T>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  post<T>(
    path: string,
    body: any,
    extraHeaders?: { [key: string]: string },
    doNotParse?: boolean,
    synchronous?: boolean,
  ): Observable<T>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  put<T>(
    path: string,
    body: any,
    extraHeaders?: { [key: string]: string },
    doNotParse?: boolean,
    synchronous?: boolean,
  ): Observable<T>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  patch<T>(
    path: string,
    body: any,
    extraHeaders?: { [key: string]: string },
    doNotParse?: boolean,
    synchronous?: boolean,
  ): Observable<T>;
  delete(path: string, extraHeaders?: { [key: string]: string }, synchronous?: boolean): Observable<void>;
  head(path: string, extraHeaders?: { [key: string]: string }): Observable<Response>;
  getZones(): Observable<{ [key: string]: string }>;
  getZoneSlug(zoneId: string): Observable<string>;
  getFullUrl(path: string): string;
  getObjectURL(path: string): Observable<string>;
}

export interface IDb {
  getAccounts(): Observable<Account[]>;
  createAccount(account: AccountCreation): Observable<Account>;
  getAccountStatus(account: string): Observable<AccountStatus>;
  modifyAccount(account: string, data: Partial<Account>): Observable<void>;
  deleteAccount(account: string): Observable<void>;
  getWelcome(): Observable<Welcome>;
  getAccount(): Observable<Account>;
  getAccount(account?: string): Observable<Account>;
  getKnowledgeBoxes(account: string): Observable<IKnowledgeBoxItem[]>;
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
}

export interface NucliaOptions {
  backend: string;
  zone?: string;
  apiKey?: string;
  account?: string;
  accountType?: AccountTypes;
  knowledgeBox?: string;
  kbSlug?: string;
  client?: string;
  standalone?: boolean;
  public?: boolean;
}

export type PromiseMapper<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => Observable<infer V> ? (...args: A) => Promise<V> : T[K];
};
