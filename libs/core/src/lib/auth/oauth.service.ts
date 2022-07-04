import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { OAuthConsentData } from '../models';
import { BackendConfigurationService } from '../config';
import { SDKService } from '../api';

export type OAuthErrors =
  | 'login_error'
  | 'unknown_login_challenge'
  | 'submit_consent_error'
  | 'unknown_consent_challenge'
  | 'get_consent_error';

const STF_LOGIN = '/auth/oauth/login';
const STF_CONSENT = '/auth/oauth/consent';

@Injectable({
  providedIn: 'root',
})
export class OAuthService {
  constructor(private config: BackendConfigurationService, private sdk: SDKService) {}

  loginUrl() {
    return this.config.getAPIURL() + STF_LOGIN;
  }

  consentUrl() {
    return this.config.getAPIURL() + STF_CONSENT;
  }

  getConsentData(challenge: string): Observable<OAuthConsentData> {
    return this.sdk.nuclia.rest.get<OAuthConsentData>(this.consentUrl() + `?consent_challenge=${challenge}`);
  }
}
