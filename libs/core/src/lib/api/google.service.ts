import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { APIService } from './api.service';
import { AuthTokens } from '../models';
import { BackendConfigurationService } from '../config';

@Injectable({
  providedIn: 'root',
})
export class GoogleService {
  constructor(private api: APIService, private config: BackendConfigurationService) {}

  getGoogleLoginUrl(): string {
    return this.config.getAPIURL() + `/auth/google/authorize`;
  }

  login(code: string, state: string): Observable<AuthTokens> {
    const url = this.getLoginUrl(state);
    if (url === null || !this.isSafeRedirect(url)) {
      return throwError('Invalid state');
    }
    const data = { code: code };
    return this.api.post(url, JSON.stringify(data), false);
  }

  private getLoginUrl(state: string): string | null {
    let decoded;
    try {
      // state is a base64 encoded json
      decoded = JSON.parse(atob(state));
    } catch {
      return null;
    }
    const hasUrl = typeof decoded === 'object' && typeof decoded.login_url === 'string';
    return hasUrl ? decoded.login_url : null;
  }

  private isSafeRedirect(redirectUrl: string) {
    return redirectUrl.startsWith(this.config.getAPIURL());
  }
}
