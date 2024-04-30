import { from, Observable, of, ReplaySubject, Subscription, tap, throwError, timer } from 'rxjs';
import { fromFetch } from 'rxjs/fetch';
import { catchError, filter, map, skip, switchMap } from 'rxjs/operators';
import { JwtHelper, JwtUser } from './jwt-helpers';
import type { IAuthentication, INuclia } from '../models';

import type { AuthTokens, NucliaDBRole } from './auth.models';

const LOCALSTORAGE_AUTH_KEY = 'JWT_KEY';
const LOCALSTORAGE_REFRESH_KEY = 'JWT_REFRESH_KEY';
// Restore the 6 hours delay as 5 minutes is too painful for the desktop
// (temporary until we have the Deno agent)
const REFRESH_DELAY = 6 * 60 * 60 * 1000; // 6 hours
// const REFRESH_DELAY = 5 * 60 * 1000; // 5 min

/**
 * It manages authentication to the Nuclia backend.
 * It can be based on login/password for account authentication,
 * or on an API key for private Knowledge Box authentication.
 * Authentication is not necessary when using a public Knowledge Box.
 */
export class Authentication implements IAuthentication {
  private nuclia: INuclia;
  private _isAuthenticated = new ReplaySubject<boolean>(1);
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

  /**
   * Returns the authentication header (which will be `Authorization` for account authentication, or `X-NUCLIA-SERVICEACCOUNT` for private Knowledge Box authentication).
   *
   * Example:
    ```ts
    const headers = nuclia.auth.getAuthHeaders();
    ```
   */
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
    if (
      path === '/kbs' ||
      ((method === 'PATCH' || method === 'DELETE') && path?.startsWith('/kb') && path?.split('/').length === 3)
    ) {
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

  /**
   * Emits when the authentication status changes.
   *
   * Example:
    ```ts
    nuclia.auth.isAuthenticated().subscribe((isAuthenticated) => {
      if (isAuthenticated) {
        console.log('You are authenticated');
      } else {
        console.log('You are not authenticated');
      }
    });
    ```
   */
  isAuthenticated(): Observable<boolean> {
    return this._isAuthenticated.asObservable();
  }

  /**
   * Returns an `Observable` emitting when the user has logged out.
   *
   * Example:
    ```ts
    nuclia.auth.hasLoggedOut().subscribe((loggedOut) => {
      if (loggedOut) {
        // do something
      }
    });
    ```
   */
  hasLoggedOut(): Observable<boolean> {
    return this.isAuthenticated().pipe(
      skip(1),
      filter((isAuth) => !isAuth),
    );
  }

  /**
   * Calls the login endpoint for account authentication and emits when done.
   *
   * It can optionally take a reCaptcha validation code if the Nuclia backend requires it.
   * Once authenticated, the Nuclia SDK will periodically refresh the token before it expires.
   *
   * Example:
    ```ts
    nuclia.auth.login(username, password).subscribe({
      next: (success) => {
        this.loginError = success ? '' : 'Error';
        console.log('logged in', success);
      },
      error: (error) => {
        this.loginError = 'Error';
        console.error(error);
      },
      complete: () => {
        this.pending = false;
      },
    });
    ```
   */
  login(username: string, password: string, validation?: string): Observable<boolean> {
    return this.fetch<AuthTokens>(
      '/auth/login',
      { username, password },
      false,
      validation ? { 'X-STF-VALIDATION': validation } : {},
    ).pipe(map((tokens) => this.authenticate(tokens)));
  }

  /**
   * Returns a boolean if successful. Stores authentication tokens in localStorage and triggers `isAuthenticated`.
   *
   * This method is automatically called when using `login` and can be useful when using a custom authentication flow.
   *
   * Example:
      ```ts
      nuclia.auth.authenticate(tokens);
      ```
   */
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

  /** Calls the logout endpoint and removes the token stored in localStorage. */
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

  /** Returns authentication token stored in localStorage. */
  getToken(force?: boolean): string {
    if (force) {
      return localStorage.getItem(LOCALSTORAGE_AUTH_KEY) || '';
    }
    let token = '';
    try {
      token = this.nuclia.options.public ? '' : localStorage.getItem(LOCALSTORAGE_AUTH_KEY) || '';
    } catch (e) {
      // Local storage is disabled
    }
    return token;
  }

  /**
   * Sets the current user’s password.
   *
   * Example:
    ```ts
    nuclia.auth.setPassword(password).subscribe({
      next: (success) => {
        this.passwordError = success ? '' : 'Error';
        console.log('password set', success);
      },
      error: (error) => {
        this.passwordError = 'Error';
        console.error(error);
      },
      complete: () => {
        this.pending = false;
      },
    });
    ```
   */
  setPassword(password: string): Observable<boolean> {
    return this.fetch<AuthTokens>('/auth/setpassword', { password }, true, {}).pipe(
      map((tokens) => this.authenticate(tokens)),
    );
  }

  /**
   * Deletes current user account and removes stored tokens.
   *
   * Example:
    ```ts
    nuclia.auth.deleteAuthenticatedUser().subscribe(() => {
      console.log('User deleted');
    });
    ```
   */
  deleteAuthenticatedUser(): Observable<void> {
    return this.nuclia.rest.delete('/user').pipe(tap(() => this.storeTokens({ access_token: '', refresh_token: '' })));
  }

  /**
   * Parses JWT token and returns corresponding user information.
   *
   * Example:
    ```ts
    const user = nuclia.auth.getJWTUser();
    console.log(`Hello ${user?.ext.first_name}!`);
    ```
   */
  getJWTUser(): JwtUser | null {
    const token = this.getToken();
    if (token) {
      const helper = new JwtHelper(token);
      return helper.getJWTUser();
    }
    return null;
  }

  /** Returns refresh token stored in localStorage. */
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
      const now = new Date().getTime();
      if (expiration && expiration < now) {
        this.logout();
      } else {
        this._isAuthenticated.next(true);
        // we refresh the token in 6 hours (or immediately if it should expire sooner)
        // note: expiration might be undefined when running e2e tests, if so, we just use the default delay
        const timeout = expiration && expiration - now < REFRESH_DELAY ? 0 : REFRESH_DELAY;
        this.timerSubscription?.unsubscribe();
        this.timerSubscription = timer(timeout)
          .pipe(switchMap(() => (this.getRefreshToken() ? this.refresh() : of(false))))
          .subscribe();
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
          return throwError(() => response);
        }
        return from(response.clone().json());
      }),
    );
  }
}
