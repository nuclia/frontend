import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthTokens } from '@nuclia/core';
import { SDKService } from '../api';

@Injectable({
  providedIn: 'root',
})
export class SAMLService {
  constructor(private sdk: SDKService) {}

  checkDomain(domain: string): Observable<{ account_id: string }> {
    return this.sdk.nuclia.rest.get<{ account_id: string }>(`/auth/saml/inquiry?domain=${domain}`);
  }

  ssoUrl(accountId: string, loginChallenge?: string): string {
    let url = this.sdk.nuclia.backend + `/auth/saml/sso?account_id=${accountId}`;
    if (loginChallenge) {
      url += `&login_challenge=${loginChallenge}`;
    }
    // Add came_from parameter for migration process
    url += `&came_from=${encodeURIComponent(window.location.origin)}`;
    return url;
  }

  getToken(tmpToken: string): Observable<AuthTokens> {
    return this.sdk.nuclia.rest.post<AuthTokens>('/auth/saml/token', { token: tmpToken });
  }
}
