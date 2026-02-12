import { from, Observable, of, ReplaySubject, Subscription, tap, throwError, timer } from 'rxjs';
import { fromFetch } from 'rxjs/fetch';
import { catchError, filter, map, skip, switchMap } from 'rxjs/operators';
import { JwtHelper, JwtUser } from './jwt-helpers';
import type { IAuthentication, INuclia } from '../models';

import type { AuthInfo, AuthTokens, NucliaDBRole } from './auth.models';

const LOCALSTORAGE_AUTH_KEY = 'JWT_KEY';
const LOCALSTORAGE_REFRESH_KEY = 'JWT_REFRESH_KEY';
const LOCALSTORAGE_ID_TOKEN_KEY = 'JWT_ID_TOKEN_KEY';
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
      path?.endsWith('/ask')
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

  getAuthUrl(): string {
    if (!this.nuclia.options.oauth) {
      throw new Error('OAuth parameters are missing.');
    }
    return `${this.nuclia.options.oauth.auth}/api/auth`;
  }

  redirectToOAuth(queryParams?: { [key: string]: string }) {
    const oauthParams = this.nuclia.options.oauth;
    if (!oauthParams) {
      throw new Error('OAuth parameters are missing.');
    }
    if (!queryParams || Object.keys(queryParams).length === 0) {
      queryParams = { random: this.generateSecureToken(32) };
    }
    const stateToken = btoa(JSON.stringify(queryParams));
    const nonceToken = this.generateSecureToken(32);

    // Generate PKCE parameters
    const codeVerifier = this.generateCodeVerifier();
    this.generateCodeChallenge(codeVerifier).then((codeChallenge) => {
      sessionStorage.setItem('oauth_state', stateToken);
      sessionStorage.setItem('oauth_nonce', nonceToken);
      sessionStorage.setItem('code_verifier', codeVerifier);

      const authParams = new URLSearchParams({
        response_type: 'code',
        client_id: oauthParams.client_id,
        redirect_uri: `${location.origin}/user/callback`,
        scope: 'offline_access openid',
        state: stateToken,
        nonce: nonceToken,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
      });

      const authorizationUrl = `${oauthParams.hydra}/oauth2/auth?${authParams}`;

      console.log('Initiating OAuth flow with PKCE:', authorizationUrl);
      window.location.href = authorizationUrl;
    });
  }

  processAuthorizationResponse(authCode: string, returnedState: string): Observable<{ success: boolean; state: any }> {
    if (!this.nuclia.options.oauth) {
      throw new Error('OAuth parameters are missing.');
    }
    const expectedState = sessionStorage.getItem('oauth_state');

    if (returnedState !== expectedState) {
      console.error('State validation failed - possible security issue');
      return of({ success: false, state: {} });
    }
    return this.exchangeAuthorizationCode(authCode).pipe(
      map(() => {
        sessionStorage.removeItem('oauth_state');
        sessionStorage.removeItem('oauth_nonce');
        let state = {};
        try {
          state = JSON.parse(atob(returnedState));
        } catch {
          console.error('Cannot parse state');
        }
        return { success: true, state };
      }),
    );
  }

  private exchangeAuthorizationCode(authCode: string) {
    if (!this.nuclia.options.oauth) {
      throw new Error('OAuth parameters are missing.');
    }
    const codeVerifier = sessionStorage.getItem('code_verifier');

    if (!codeVerifier) {
      throw new Error('Code verifier not found - PKCE flow compromised');
    }

    const tokenRequestBody = new URLSearchParams({
      grant_type: 'authorization_code',
      code: authCode,
      redirect_uri: `${window.location.origin}/user/callback`,
      client_id: this.nuclia.options.oauth.client_id,
      code_verifier: codeVerifier,
    });

    return this.fetch<AuthTokens>(`${this.nuclia.options.oauth.hydra}/oauth2/token`, tokenRequestBody, {}, true).pipe(
      map((tokenData) => {
        this.authenticate(tokenData);
        sessionStorage.removeItem('code_verifier');
      }),
    );
  }

  private generateSecureToken(length: number) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const values = new Uint8Array(length);
    crypto.getRandomValues(values);
    return Array.from(values)
      .map((v) => chars[v % chars.length])
      .join('');
  }

  private generateCodeVerifier() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return this.base64URLEncode(array);
  }

  private base64URLEncode(buffer: Uint8Array<ArrayBuffer>) {
    return btoa(String.fromCharCode(...buffer))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  private generateCodeChallenge(verifier: string) {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    return crypto.subtle.digest('SHA-256', data).then((hash) => this.base64URLEncode(new Uint8Array(hash)));
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
    // TO BE REMOVED?
    return of(false);
    // return this.fetch<AuthTokens>(
    //   '/auth/login',
    //   { username, password },
    //   false,
    //   validation ? { 'X-STF-VALIDATION': validation } : {},
    // ).pipe(map((tokens) => this.authenticate(tokens)));
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
    if (!this.nuclia.options.oauth) {
      throw new Error('OAuth parameters are missing.');
    }
    const id_token = localStorage.getItem(LOCALSTORAGE_ID_TOKEN_KEY) || '';
    localStorage.removeItem(LOCALSTORAGE_AUTH_KEY);
    localStorage.removeItem(LOCALSTORAGE_REFRESH_KEY);
    localStorage.removeItem(LOCALSTORAGE_ID_TOKEN_KEY);
    const logoutParams = new URLSearchParams({
      id_token_hint: id_token,
      post_logout_redirect_uri: window.location.origin,
    });
    window.location.assign(`${this.nuclia.options.oauth.hydra}/oauth2/sessions/logout?${logoutParams}`);
  }

  refresh(): Observable<boolean> {
    if (!this.nuclia.options.oauth) {
      throw new Error('OAuth parameters are missing.');
    }
    return this.fetch<AuthTokens>(
      `${this.nuclia.options.oauth.hydra}/oauth2/token`,
      {
        grant_type: 'refresh_token',
        client_id: this.nuclia.options.oauth.client_id,
        refresh_token: this.getRefreshToken(),
      },
      {},
    ).pipe(
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
    if (!this.nuclia.options.oauth) {
      throw new Error('OAuth parameters are missing.');
    }
    return this.fetch<AuthTokens>(`${this.getAuthUrl()}/setpassword`, { password }).pipe(
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

  /** Returns authentication information */
  getAuthInfo(includeIP = false): Observable<AuthInfo> {
    return this.nuclia.rest.get(`/authorizer/info${includeIP ? '?ip_info=1' : ''}`);
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
    localStorage.setItem(LOCALSTORAGE_ID_TOKEN_KEY, tokens.id_token || '');
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
    url: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body?: any,
    extraHeaders?: { [key: string]: string },
    formUrlencoded?: boolean,
  ): Observable<T> {
    const headers: { [key: string]: string } = {
      'content-type': formUrlencoded ? 'application/x-www-form-urlencoded' : 'application/json',
      ...(extraHeaders || {}),
    };
    return fromFetch(url, {
      method: 'POST',
      selector: (response) => Promise.resolve(response),
      headers,
      body: formUrlencoded ? body : JSON.stringify(body),
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
