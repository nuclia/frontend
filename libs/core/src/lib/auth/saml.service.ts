import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthTokens } from '@nuclia/core';
import { SDKService } from '../api';

@Injectable({
  providedIn: 'root',
})
export class SAMLService {
  constructor(private sdk: SDKService) {}

  checkDomain(domain: string): Observable<{ token: string }> {
    const authUrl = this.sdk.nuclia.auth.getAuthUrl();
    return this.sdk.nuclia.rest.get<{ token: string }>(`${authUrl}/saml/inquiry?domain=${domain}`);
  }

  ssoUrl(token: string, loginChallenge?: string): string {
    const authUrl = this.sdk.nuclia.auth.getAuthUrl();
    let url = `${authUrl}/saml/sso?token=${encodeURIComponent(token)}`;
    if (loginChallenge) {
      url += `&login_challenge=${loginChallenge}`;
    }
    // Add came_from parameter for migration process
    url += `&came_from=${encodeURIComponent(window.location.origin)}`;
    return url;
  }

  getToken(tmpToken: string): Observable<AuthTokens> {
    const authUrl = this.sdk.nuclia.auth.getAuthUrl();
    return this.sdk.nuclia.rest.post<AuthTokens>(`${authUrl}/saml/token`, { token: tmpToken });
  }
}
