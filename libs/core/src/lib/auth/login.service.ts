import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AuthTokens,
  LoginData,
  RecoverData,
  ResetData,
  ResetResponse,
  SetUserPreferences,
  SignupData,
  SignupResponse,
} from '../models';
import { SDKService } from '../api';
import { BackendConfigurationService } from '../config';

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  constructor(
    private config: BackendConfigurationService,
    private sdk: SDKService,
  ) {}

  login(data: LoginData, token: string): Observable<AuthTokens> {
    const headers = { 'X-STF-VALIDATION': token };
    return this.sdk.nuclia.rest.post(this.sdk.nuclia.auth.getLoginUrl() + '/auth/login', data, headers);
  }

  recover(data: RecoverData, token: string): Observable<ResetResponse> {
    const headers = { 'X-STF-VALIDATION': token };
    return this.sdk.nuclia.rest.post(this.sdk.nuclia.auth.getLoginUrl() + '/auth/recover', data, headers);
  }

  reset(data: ResetData, token: string): Observable<ResetResponse> {
    const headers = { 'X-STF-VALIDATION': token };
    return this.sdk.nuclia.rest.post(this.sdk.nuclia.auth.getLoginUrl() + '/auth/reset', data, headers);
  }

  signup(user: SignupData, token: string): Observable<SignupResponse> {
    const headers = { 'X-STF-VALIDATION': token };
    return this.sdk.nuclia.rest.post(this.sdk.nuclia.auth.getLoginUrl() + `/auth/signup`, user, headers);
  }

  setPreferences(data: SetUserPreferences) {
    const url = this.config.getAPIURL() + `/v1/user`;
    return this.sdk.nuclia.rest.patch(url, data);
  }
}
