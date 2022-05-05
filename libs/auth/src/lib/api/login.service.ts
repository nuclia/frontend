import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { LoginData, RecoverData, AuthTokens } from '../models';
import {
  SignupData,
  SignupResponse,
  ResetData,
  ResetResponse,
  SetPasswordData,
  User,
  SetUserPreferences,
} from '../models';
import { APIService } from '../api.service';
import { BackendConfigurationService } from '../backend-config.service';
import { Welcome } from '@nuclia/core';

const VERSION = 'v1';
const AUTH = 'auth';
const USER = 'user';

const STF_RECOVER = '/@recover';
const STF_RESET = '/@reset';

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  constructor(private config: BackendConfigurationService, private api: APIService) {}

  login(data: LoginData, token: string): Observable<AuthTokens> {
    const headers = [['X-STF-VALIDATION', token]];
    return this.api.post(
      this.config.getAPIURL() + '/auth/login',
      JSON.stringify(data),
      false,
      'json',
      'application/json',
      false,
      headers,
    );
  }

  recover(data: RecoverData, token: string): Observable<ResetResponse> {
    if (this.config.getNewApi()) {
      const headers = [['X-STF-VALIDATION', token]];
      return this.api.post(
        this.config.getAPIURL() + '/auth/recover',
        JSON.stringify(data),
        false,
        'json',
        'application/json',
        false,
        headers,
      );
    } else {
      const headers = [['X-VALIDATION-STF', token]];
      return this.api.post(
        this.config.getAPIURL() + STF_RECOVER,
        JSON.stringify(data),
        false,
        'json',
        'application/json',
        false,
        headers,
      );
    }
  }

  reset(data: ResetData, token: string): Observable<ResetResponse> {
    if (this.config.getNewApi()) {
      const headers = [['X-STF-VALIDATION', token]];
      return this.api.post(
        this.config.getAPIURL() + '/auth/reset',
        JSON.stringify(data),
        false,
        'json',
        'application/json',
        false,
        headers,
      );
    } else {
      const headers = [['X-VALIDATION-STF', token]];
      return this.api.post(
        this.config.getAPIURL() + STF_RESET,
        JSON.stringify(data),
        false,
        'json',
        'application/json',
        false,
        headers,
      );
    }
  }

  signup(user: SignupData, token: string): Observable<SignupResponse> {
    const headers = [['X-STF-VALIDATION', token]];
    return this.api.post(
      this.config.getAPIURL() + `/${AUTH}/signup`,
      JSON.stringify(user),
      false,
      'json',
      'application/json',
      false,
      headers,
    );
  }

  refreshUserToken(tokens: AuthTokens): Observable<AuthTokens> {
    const token = {
      refresh_token: tokens.refresh_token,
    };
    return this.api.post(
      this.config.getAPIURL() + `/${AUTH}/refresh`,
      JSON.stringify(token),
      true,
      'json',
      'application/json',
    );
  }

  getMe(): Observable<User> {
    return this.api.get(this.config.getAPIURL() + `/${VERSION}/${USER}`);
  }

  getWelcome(): Observable<Welcome> {
    return this.api.get(this.config.getAPIURL() + `/${VERSION}/${USER}/welcome`);
  }

  setPreferences(data: SetUserPreferences) {
    const url = this.config.getAPIURL() + `/${VERSION}/${USER}`;
    return this.api.patch(url, JSON.stringify(data), true);
  }

  setPassword(password: string): Observable<AuthTokens> {
    const data: SetPasswordData = { password: password };
    const url = `/${AUTH}/setpassword`;
    return this.api.post(url, JSON.stringify(data), true, undefined, undefined, true);
  }
}
