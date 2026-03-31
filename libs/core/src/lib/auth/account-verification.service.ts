import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SDKService } from '../api';
import { AuthService } from './auth.service';

export const PENDING_ACCOUNT_DELETE_KEY = 'PENDING_ACCOUNT_DELETE';
const REAUTH_WINDOW_SECONDS = 5 * 60; // 5 minutes

@Injectable({
  providedIn: 'root',
})
export class AccountVerificationService {
  constructor(
    private sdk: SDKService,
    private authService: AuthService,
  ) {}

  /** Returns last_verified_at Unix timestamp from JWT, or null if not present */
  getLastVerifiedAt(): number | null {
    const user = this.sdk.nuclia.auth.getJWTUser();
    return user?.ext?.last_verified_at ?? null;
  }

  /** True if forced reauth is supported (last_verified_at present in JWT) */
  supportsForceReauth(): boolean {
    return this.getLastVerifiedAt() !== null;
  }

  /** True if last_verified_at was set within the last 5 minutes */
  isRecentlyVerified(): boolean {
    const lastVerified = this.getLastVerifiedAt();
    if (lastVerified === null) return false;
    const nowSeconds = Math.floor(Date.now() / 1000);
    return nowSeconds - lastVerified <= REAUTH_WINDOW_SECONDS;
  }

  /**
   * Redirects browser to force reauthentication via the standard OAuth PKCE flow,
   * with `prompt=login` and `max_age=0` so the auth server requires a fresh login
   * regardless of any existing session.  `came_from` is embedded in the PKCE state
   * so the callback can redirect back to the original page after re-auth.
   *
   * Uses the same OAuth flow as the normal unauthenticated login path — this is
   * provider-agnostic and does NOT rely on `ext.type` from the JWT (which is a
   * user-type discriminator, not an OAuth provider slug).
   */
  forceReauth(returnUrl: string): void {
    localStorage.setItem(PENDING_ACCOUNT_DELETE_KEY, returnUrl);
    this.authService.setNextUrl(new URL(returnUrl).pathname);
    this.sdk.nuclia.auth.redirectToOAuth({ came_from: returnUrl }, { prompt: 'login', max_age: '0' });
  }

  /** True if there is a pending account delete that triggered a reauth */
  hasPendingDelete(): boolean {
    return !!localStorage.getItem(PENDING_ACCOUNT_DELETE_KEY);
  }

  /** Clears the pending account delete flag */
  clearPendingDelete(): void {
    localStorage.removeItem(PENDING_ACCOUNT_DELETE_KEY);
  }

  /** Requests an email OTP for the currently authenticated user */
  requestEmailOtp(): Observable<void> {
    return this.sdk.nuclia.auth.requestEmailOtp();
  }
}
