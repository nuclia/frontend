import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { SsoLoginResponse } from '../models';
import { SDKService } from './sdk.service';

@Injectable({
  providedIn: 'root',
})
export class SsoService {
  constructor(private sdk: SDKService) {}

  getSsoLoginUrl(provider: 'google' | 'github' | 'microsoft'): string {
    const params = new URLSearchParams();
    params.set('came_from', window.location.origin);

    // Include login_challenge if present in current URL (for OAuth flows from other apps)
    const currentParams = new URLSearchParams(window.location.search);
    const loginChallenge = currentParams.get('login_challenge');
    if (loginChallenge) {
      params.set('login_challenge', loginChallenge);
    }
    if (!this.sdk.nuclia.options.oauth) {
      throw new Error('OAuth parameters are missing.');
    }

    return `${this.sdk.nuclia.options.oauth.auth}/api/auth/${provider}/authorize?${params.toString()}`;
  }

  login(code: string, state: string): Observable<SsoLoginResponse> {
    const url = this.getLoginUrl(state);
    const apiUrl = this.sdk.nuclia.auth.getLoginUrl();

    if (url === null || !this.isSafeRedirect(url, apiUrl)) {
      console.error('[SSO] Invalid state - URL validation failed');
      console.error('[SSO] Expected login_url to start with:', apiUrl);
      console.error('[SSO] Received login_url:', url);
      console.error('[SSO] Current window.location.origin:', window.location.origin);
      return throwError(() => new Error('Invalid state'));
    }

    const decoded = this.decodeState(state);
    const body: { code: string; login_challenge?: string } = { code };

    // Include login_challenge if present in state (for OAuth flows from other apps)
    if (decoded['login_challenge']) {
      body.login_challenge = decoded['login_challenge'];
    }

    return this.sdk.nuclia.rest.post(url, body);
  }

  private getLoginUrl(state: string): string | null {
    const decoded = this.decodeState(state);
    const hasUrl = typeof decoded['login_url'] === 'string';
    return hasUrl ? decoded['login_url'] : null;
  }

  private isSafeRedirect(redirectUrl: string, apiUrl: string) {
    // Validate that the login_url domain matches the expected API domain
    try {
      const redirectUrlObj = new URL(redirectUrl);
      const apiUrlObj = new URL(apiUrl);
      
      // Allow if same origin as the API
      return redirectUrlObj.origin === apiUrlObj.origin;
    } catch {
      return false;
    }
  }

  decodeState(state: string): { [key: string]: string } {
    try {
      return JSON.parse(atob(state));
    } catch {
      return {};
    }
  }
}
