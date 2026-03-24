import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { OAuthConsentData, OAuthLoginData } from '../models';
import { SDKService } from '../api';

export type OAuthErrors =
  | 'login_error'
  | 'unknown_login_challenge'
  | 'submit_consent_error'
  | 'unknown_consent_challenge'
  | 'get_consent_error';

const SIGNUP_DATA = 'SIGNUP_DATA';
const CAME_FROM_KEY = 'SIGNUP_CAME_FROM';
@Injectable({
  providedIn: 'root',
})
export class OAuthService {
  private sdk = inject(SDKService);

  loginUrl() {
    return `${this.sdk.nuclia.auth.getAuthUrl()}/oauth/login`;
  }

  consentUrl() {
    return `${this.sdk.nuclia.auth.getAuthUrl()}/oauth/consent`;
  }

  getLoginData(challenge: string, user_hint: string | null): Observable<OAuthLoginData> {
    let url = this.loginUrl() + `?login_challenge=${challenge}`;
    if (user_hint) {
      url += `&user_hint=${user_hint}`;
    }
    return this.sdk.nuclia.rest.get<OAuthLoginData>(url);
  }

  getConsentData(challenge: string): Observable<OAuthConsentData> {
    return this.sdk.nuclia.rest.get<OAuthConsentData>(this.consentUrl() + `?consent_challenge=${challenge}`);
  }

  getSignUpData(): { email: string; fullname?: string; company?: string } | undefined {
    const data = localStorage.getItem(SIGNUP_DATA);
    if (data) {
      return JSON.parse(data);
    } else {
      return undefined;
    }
  }

  setSignUpData(data: { email: string; fullname?: string; company?: string }) {
    localStorage.setItem(SIGNUP_DATA, JSON.stringify(data));
  }

  getCameFrom() {
    return localStorage.getItem(CAME_FROM_KEY) || this.sdk.getOriginForApp('rag');
  }

  setCameFrom(cameFrom: string) {
    localStorage.setItem(CAME_FROM_KEY, cameFrom);
  }
}
