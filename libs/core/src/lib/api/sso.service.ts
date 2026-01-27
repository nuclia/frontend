import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { AuthTokens } from '../models';
import { BackendConfigurationService } from '../config';
import { SDKService } from './sdk.service';

@Injectable({
  providedIn: 'root',
})
export class SsoService {
  constructor(
    private sdk: SDKService,
    private config: BackendConfigurationService,
  ) {}

  getSsoLoginUrl(provider: 'google' | 'github' | 'microsoft'): string {
    const params = new URLSearchParams();
    params.set('came_from', window.location.origin);
    
    // Include login_challenge if present in current URL (for OAuth flows from other apps)
    const currentParams = new URLSearchParams(window.location.search);
    const loginChallenge = currentParams.get('login_challenge');
    console.log('SSO Login - Current URL:', window.location.href);
    console.log('SSO Login - login_challenge:', loginChallenge);
    if (loginChallenge) {
      params.set('login_challenge', loginChallenge);
    }
    
    const finalUrl = `${this.config.getAPIURL()}/auth/${provider}/authorize?${params.toString()}`;
    console.log('SSO Login - Final URL:', finalUrl);
    return finalUrl;
  }

  login(code: string, state: string): Observable<AuthTokens> {
    const url = this.getLoginUrl(state);
    if (url === null || !this.isSafeRedirect(url)) {
      return throwError(() => new Error('Invalid state'));
    }
    return this.sdk.nuclia.rest.post(url, { code });
  }

  private getLoginUrl(state: string): string | null {
    const decoded = this.decodeState(state);
    const hasUrl = typeof decoded['login_url'] === 'string';
    return hasUrl ? decoded['login_url'] : null;
  }

  private isSafeRedirect(redirectUrl: string) {
    return redirectUrl.startsWith(this.config.getAPIURL());
  }

  decodeState(state: string): { [key: string]: string } {
    try {
      return JSON.parse(atob(state));
    } catch {
      return {};
    }
  }
}
