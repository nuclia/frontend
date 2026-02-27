import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { OAuthConsentData, OAuthLoginData } from '../models';
import { SDKService } from '../api';

export type OAuthErrors =
  | 'login_error'
  | 'unknown_login_challenge'
  | 'submit_consent_error'
  | 'unknown_consent_challenge'
  | 'get_consent_error';

const EMAIL_KEY = 'SIGNUP_EMAIL';
@Injectable({
  providedIn: 'root',
})
export class OAuthService {
  signupEmail = '';
  constructor(private sdk: SDKService) {}

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

  getEmail() {
    return localStorage.getItem(EMAIL_KEY) || '';
  }

  setEmail(email: string) {
    localStorage.setItem(EMAIL_KEY, email);
  }
}
