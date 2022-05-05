import { ReplaySubject, Observable, Subscription, timer, throwError } from 'rxjs';
import { fromFetch } from 'rxjs/fetch';
import { catchError, filter, map, skip, switchMap, tap } from 'rxjs/operators';
import { JwtHelper, JwtUser } from './jwt-helpers';
import type { IAuthentication, INuclia } from '../models';

import type { AuthTokens } from './auth.models';

const LOCALSTORAGE_AUTH_KEY = 'JWT_KEY';
const LOCALSTORAGE_REFRESH_KEY = 'JWT_REFRESH_KEY';

export class Authentication implements IAuthentication {
  private nuclia: INuclia;
  private _isAuthenticated: ReplaySubject<boolean> = new ReplaySubject(1);
  private _hasLoggedOut: ReplaySubject<boolean> = new ReplaySubject(1);
  private timerSubscription?: Subscription;

  public constructor(nuclia: INuclia) {
    this.nuclia = nuclia;
    if (this.nuclia.options.knowledgeBox) {
      // if knowledgeBox is defined, we are using searvice account (or the kb is public)
      this._isAuthenticated.next(true);
    } else {
      this.checkTokenExpiration();
      this._isAuthenticated.next(!!this.getToken());
    }
  }

  getAuthHeaders(): { [key: string]: string } {
    return this.nuclia.options.apiKey
      ? { 'X-STF-Serviceaccount': `Bearer ${this.nuclia.options.apiKey}` }
      : this.getToken()
      ? { Authorization: `Bearer ${this.getToken()}` }
      : {};
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
    return this.fetch<AuthTokens>('/auth/refresh', { refresh_token: this.getRefreshToken() }, true, {}).pipe(
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
    return localStorage.getItem(LOCALSTORAGE_AUTH_KEY) || '';
  }

  setPassword(password: string): Observable<boolean> {
    return this.fetch<AuthTokens>('/auth/setpassword', { password }, true, {}).pipe(
      map((tokens) => this.authenticate(tokens)),
    );
  }

  getJWTUser(): JwtUser | null {
    const token = this.getToken();
    if (token) {
      const helper = new JwtHelper(token);
      return helper.getJWTUser();
    }
    return null;
  }

  private getRefreshToken(): string {
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
          console.log('expired token, lets refresh');
          this.refresh().subscribe();
        } else {
          // we refresh the token 1 minute before expiration, or immediately if it's less than 1 minute
          const timeout = Math.max(expiration - now - 60 * 1000, 0);
          this.timerSubscription?.unsubscribe();
          this.timerSubscription = timer(timeout)
            .pipe(switchMap(() => this.refresh()))
            .subscribe();
        }
      }
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
      headers.Authorization = `Bearer ${this.getToken()}`;
    }
    return fromFetch<T>(`${this.nuclia.backend}${path}`, {
      method: 'POST',
      selector: (response) => response.json(),
      headers,
      body: JSON.stringify(body),
    });
  }
}
