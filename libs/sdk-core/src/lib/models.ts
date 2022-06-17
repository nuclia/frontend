import type { Observable } from 'rxjs';
import type { AuthTokens } from './auth/auth.models';
import type { JwtUser } from './auth/jwt-helpers';
import type {
  Account,
  AccountCreation,
  AccountStatus,
  AccountTypes,
  EventList,
  IKnowledgeBoxItem,
  KnowledgeBox,
  KnowledgeBoxCreation,
  NUAClient,
  NUAClientPayload,
  ProcessingStat,
  StatsPeriod,
  StatsType,
  Welcome,
  WritableKnowledgeBox,
} from './db';

export interface INuclia {
  options: NucliaOptions;
  auth: IAuthentication;
  rest: IRest;
  db: IDb;
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
  getJWTUser(): JwtUser | null;
}

export interface IRest {
  get<T>(path: string, extraHeaders?: { [key: string]: string }, doNotParse?: boolean): Observable<T>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  post<T>(path: string, body: any, extraHeaders?: { [key: string]: string }, doNotParse?: boolean): Observable<T>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  put<T>(path: string, body: any, extraHeaders?: { [key: string]: string }, doNotParse?: boolean): Observable<T>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  patch<T>(path: string, body: any, extraHeaders?: { [key: string]: string }, doNotParse?: boolean): Observable<T>;
  delete(path: string, extraHeaders?: { [key: string]: string }): Observable<void>;
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
  upload(file: File): Observable<void>;
  pull(): Observable<void>;
  getNUAClients(account: string): Observable<NUAClient[]>;
  getNUAClient(account: string, client_id: string): Observable<NUAClient>;
  createNUAClient(account: string, data: NUAClientPayload): Observable<{ client_id: string; token: string }>;
  renewNUAClient(account: string, client_id: string): Observable<{ client_id: string; token: string }>;
  deleteNUAClient(account: string, client_id: string): Observable<void>;
  hasNUAClient(): boolean;
  getNUAActivity(account: string, client_id: string): Observable<EventList>;
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
  permalink?: boolean;
}

export type PromiseMapper<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => Observable<infer V> ? (...args: A) => Promise<V> : T[K];
};
