import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { AuthTokens, SsoLoginResponse } from '../models';
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
    if (loginChallenge) {
      params.set('login_challenge', loginChallenge);
    }
    
    return `${this.config.getAPIURL()}/auth/${provider}/authorize?${params.toString()}`;
  }

  login(code: string, state: string): Observable<SsoLoginResponse> {
    const url = this.getLoginUrl(state);
    const apiUrl = this.config.getAPIURL();
    
    if (url === null || !this.isSafeRedirect(url)) {
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

  private isSafeRedirect(redirectUrl: string) {
    try {
      const redirectUrlObj = new URL(redirectUrl);
      const apiUrlObj = new URL(this.config.getAPIURL());
      
      const redirectDomain = this.extractDomain(redirectUrlObj.hostname);
      const apiDomain = this.extractDomain(apiUrlObj.hostname);
      
      return redirectDomain === apiDomain;
    } catch {
      return false;
    }
  }

  private extractDomain(hostname: string): string {
    // Handle localhost and IP addresses
    if (hostname === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
      return hostname;
    }
    
    // Extract root domain (last 2 parts)
    const parts = hostname.split('.');
    if (parts.length >= 2) {
      return parts.slice(-2).join('.');
    }
    
    return hostname;
  }

  decodeState(state: string): { [key: string]: string } {
    try {
      return JSON.parse(atob(state));
    } catch {
      return {};
    }
  }
}
