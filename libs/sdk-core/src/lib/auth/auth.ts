import { from, Observable, ReplaySubject, Subscription, tap, throwError, timer } from 'rxjs';
import { fromFetch } from 'rxjs/fetch';
import { catchError, filter, map, skip, switchMap } from 'rxjs/operators';
import { JwtHelper, JwtUser } from './jwt-helpers';
import type { IAuthentication, INuclia } from '../models';

import type { AuthTokens, NucliaDBRole } from './auth.models';

const LOCALSTORAGE_AUTH_KEY = 'JWT_KEY';
const LOCALSTORAGE_REFRESH_KEY = 'JWT_REFRESH_KEY';
const REFRESH_DELAY = 5 * 60 * 1000; // 5 min

export class Authentication implements IAuthentication {
  private nuclia: INuclia;
  private _isAuthenticated: ReplaySubject<boolean> = new ReplaySubject(1);
  private timerSubscription?: Subscription;

  public constructor(nuclia: INuclia) {
    this.nuclia = nuclia;
    if (this.nuclia.options.knowledgeBox) {
      // if knowledgeBox is defined, we are using service account (or the kb is public)
      this._isAuthenticated.next(true);
    } else {
      this.checkTokenExpiration();
    }
  }

  getAuthHeaders(): { [key: string]: string };
  getAuthHeaders(method: string, path: string): { [key: string]: string };
  getAuthHeaders(method?: string, path?: string): { [key: string]: string } {
    return this.nuclia.options.standalone
      ? { 'X-NUCLIADB-ROLES': this.getNucliaDbRole(method, path) }
      : this.nuclia.options.apiKey
      ? { 'X-NUCLIA-SERVICEACCOUNT': `Bearer ${this.nuclia.options.apiKey}` }
      : this.getToken()
      ? { Authorization: `Bearer ${this.getToken()}` }
      : {};
  }

  private getNucliaDbRole(method?: string, path?: string): NucliaDBRole {
    let nucliaDbRole: NucliaDBRole;
    switch (method) {
      case 'PUT':
      case 'PATCH':
      case 'POST':
      case 'DELETE':
        nucliaDbRole = 'WRITER';
        break;
      default:
        nucliaDbRole = 'READER';
    }
    if (path === '/kbs' || (method === 'PATCH' && path?.startsWith('/kb') && path?.split('/').length === 3)) {
      nucliaDbRole = 'MANAGER';
    } else if (
      path?.endsWith('/search') ||
      path?.endsWith('/find') ||
      path?.endsWith('/catalog') ||
      path?.endsWith('/chat')
    ) {
      nucliaDbRole = 'READER';
    }
    return nucliaDbRole;
  }

  isAuthenticated(): Observable<boolean> {
    return this._isAuthenticated.asObservable();
  }

  hasLoggedOut(): Observable<boolean> {
    return this.isAuthenticated().pipe(
      skip(1),
      filter((isAuth) => !isAuth),
    );
  }

  login(username: string, password: string, validation?: string): Observable<boolean> {
    return this.fetch<AuthTokens>(
      '/auth/login',
      { username, password },
      false,
      validation ? { 'X-STF-VALIDATION': validation } : {},
    ).pipe(map((tokens) => this.authenticate(tokens)));
  }

  authenticate(tokens: AuthTokens): boolean {
    if (!tokens.access_token) {
      this._isAuthenticated.next(false);
      return false;
    } else {
      this.storeTokens(tokens);
      this._isAuthenticated.next(true);
      return true;
    }
  }

  logout(): void {
    this.fetch('/auth/logout', {}, true, {}).subscribe();
    localStorage.removeItem(LOCALSTORAGE_AUTH_KEY);
    localStorage.removeItem(LOCALSTORAGE_REFRESH_KEY);
    this._isAuthenticated.next(false);
  }

  refresh(): Observable<boolean> {
    return this.fetch<AuthTokens>('/auth/refresh', { refresh_token: this.getRefreshToken() }, false, {}).pipe(
      catchError((e) => {
        this.logout();
        return throwError(e);
      }),
      map((tokens: AuthTokens) => {
        if (tokens.access_token) {
          this.storeTokens(tokens);
          return true;
        } else {
          this.logout();
          return false;
        }
      }),
    );
  }

  getToken(): string {
    return this.nuclia.options.public ? '' : localStorage.getItem(LOCALSTORAGE_AUTH_KEY) || '';
  }

  setPassword(password: string): Observable<boolean> {
    return this.fetch<AuthTokens>('/auth/setpassword', { password }, true, {}).pipe(
      map((tokens) => this.authenticate(tokens)),
    );
  }

  deleteAuthenticatedUser(): Observable<void> {
    return this.nuclia.rest.delete('/user').pipe(tap(() => this.storeTokens({ access_token: '', refresh_token: '' })));
  }

  getJWTUser(): JwtUser | null {
    const token = this.getToken();
    if (token) {
      const helper = new JwtHelper(token);
      return helper.getJWTUser();
    }
    return null;
  }

  getRefreshToken(): string {
    return localStorage.getItem(LOCALSTORAGE_REFRESH_KEY) || '';
  }

  private storeTokens(tokens: AuthTokens): void {
    localStorage.setItem(LOCALSTORAGE_AUTH_KEY, tokens.access_token);
    localStorage.setItem(LOCALSTORAGE_REFRESH_KEY, tokens.refresh_token);
    this.checkTokenExpiration();
  }

  private checkTokenExpiration(): void {
    const token = this.getToken();
    if (token) {
      const helper = new JwtHelper(token);
      const expiration = helper.getTokenExpirationDate()?.getTime();
      if (expiration) {
        const now = new Date().getTime();
        if (expiration < now) {
          this.logout();
        } else {
          this._isAuthenticated.next(true);
          // we refresh the token in 6 hours (or immediately if it should expire sooner)
          const timeout = expiration - now < REFRESH_DELAY ? 0 : REFRESH_DELAY;
          this.timerSubscription?.unsubscribe();
          this.timerSubscription = timer(timeout)
            .pipe(switchMap(() => this.refresh()))
            .subscribe();
        }
      } else {
        this._isAuthenticated.next(false);
      }
    } else {
      this._isAuthenticated.next(false);
    }
  }

  private fetch<T>(
    path: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body: any,
    withAuth: boolean,
    extraHeaders: { [key: string]: string },
  ): Observable<T> {
    const headers: { [key: string]: string } = { 'content-type': 'application/json', ...extraHeaders };
    if (withAuth) {
      headers['Authorization'] = `Bearer ${this.getToken()}`;
    }
    return fromFetch(`${this.nuclia.backend}${path}`, {
      method: 'POST',
      selector: (response) => Promise.resolve(response),
      headers,
      body: JSON.stringify(body),
    }).pipe(
      switchMap((response) => {
        if (!response.ok) {
          return throwError(response);
        }
        return from(response.clone().json());
      }),
    );
  }
}
