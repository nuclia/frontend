import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { AuthTokens } from '../models';
import { BackendConfigurationService } from '../config';
import { DeprecatedApiService } from './deprecated-api.service';

@Injectable({
  providedIn: 'root',
})
export class SsoService {
  constructor(private api: DeprecatedApiService, private config: BackendConfigurationService) {}

  getSsoLoginUrl(provider: 'google' | 'github'): string {
    return `${this.config.getAPIURL()}/auth/${provider}/authorize?came_from=${window.location.origin}`;
  }

  login(code: string, state: string): Observable<AuthTokens> {
    const url = this.getLoginUrl(state);
    if (url === null || !this.isSafeRedirect(url)) {
      return throwError(() => new Error('Invalid state'));
    }
    const data = { code: code };
    return this.api.post(url, JSON.stringify(data), false);
  }

  private getLoginUrl(state: string): string | null {
    const decoded = this.decodeState(state);
    const hasUrl = typeof decoded.login_url === 'string';
    return hasUrl ? decoded.login_url : null;
  }

  private isSafeRedirect(redirectUrl: string) {
    return redirectUrl.startsWith(this.config.getAPIURL());
  }

  decodeState(state: string): { [key: string]: string } {
    try {
      return JSON.parse(atob(state));
    } catch {
      return {};
    }
  }
}
