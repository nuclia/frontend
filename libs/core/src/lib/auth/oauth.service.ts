import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BackendConfigurationService } from '../config';
import { OAuthConsentData, OAuthLoginData } from '../models';
import { SDKService } from '../api';

export type OAuthErrors =
  | 'login_error'
  | 'unknown_login_challenge'
  | 'submit_consent_error'
  | 'unknown_consent_challenge'
  | 'get_consent_error';

@Injectable({
  providedIn: 'root',
})
export class OAuthService {
  constructor(
    private config: BackendConfigurationService,
    private sdk: SDKService,
  ) {}

  loginUrl() {
    return `${this.sdk.nuclia.auth.getAuthUrl()}/oauth/login`;
  }

  consentUrl() {
    return `${this.sdk.nuclia.auth.getAuthUrl()}/oauth/consent`;
  }

  getLoginData(challenge: string): Observable<OAuthLoginData> {
    return this.sdk.nuclia.rest.get<OAuthLoginData>(this.loginUrl() + `?login_challenge=${challenge}`);
  }

  getConsentData(challenge: string): Observable<OAuthConsentData> {
    return this.sdk.nuclia.rest.get<OAuthConsentData>(this.consentUrl() + `?consent_challenge=${challenge}`);
  }
}
