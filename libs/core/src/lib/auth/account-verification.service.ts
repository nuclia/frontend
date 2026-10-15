import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SDKService } from '../api';
import { AuthService } from './auth.service';

export const PENDING_ACCOUNT_DELETE_KEY = 'PENDING_ACCOUNTS_DELETE';
const REAUTH_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const PENDING_DELETE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

/** Maps account id -> `Date.now()` (ms) when forceReauth was triggered for it. */
type PendingDeleteMap = Record<string, number>;

@Injectable({
  providedIn: 'root',
})
export class AccountVerificationService {
  constructor(
    private sdk: SDKService,
    private authService: AuthService,
  ) {}

  getLastVerifiedAt(): number | null {
    const user = this.sdk.nuclia.auth.getJWTUser();
    return user?.ext?.last_verified_at ?? null;
  }

  supportsForceReauth(): boolean {
    return this.getLastVerifiedAt() !== null;
  }

  isRecentlyVerified(): boolean {
    const lastVerified = this.getLastVerifiedAt();
    if (lastVerified === null) return false;
    return Date.now() - lastVerified * 1000 <= REAUTH_WINDOW_MS;
  }

  forceReauth(returnUrl: string, accountId: string): void {
    const map = this.pruneExpired(this.readPendingDeleteMap());
    map[accountId] = Date.now();
    this.writePendingDeleteMap(map);
    this.authService.setNextUrl(new URL(returnUrl).pathname);
    this.sdk.nuclia.auth.redirectToOAuth({ came_from: returnUrl }, { prompt: 'login', max_age: '0' });
  }

  hasPendingDelete(accountId: string): boolean {
    const map = this.pruneExpired(this.readPendingDeleteMap());
    return accountId in map;
  }

  clearPendingDelete(accountId: string): void {
    const map = this.readPendingDeleteMap();
    delete map[accountId];
    this.writePendingDeleteMap(map);
  }

  requestEmailOtp(): Observable<void> {
    return this.sdk.nuclia.auth.requestEmailOtp();
  }

  private readPendingDeleteMap(): PendingDeleteMap {
    const raw = localStorage.getItem(PENDING_ACCOUNT_DELETE_KEY);
    if (!raw) return {};

    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  private writePendingDeleteMap(map: PendingDeleteMap): void {
    if (Object.keys(map).length === 0) localStorage.removeItem(PENDING_ACCOUNT_DELETE_KEY);
    else localStorage.setItem(PENDING_ACCOUNT_DELETE_KEY, JSON.stringify(map));
  }

  private pruneExpired(map: PendingDeleteMap): PendingDeleteMap {
    const now = Date.now();
    const pruned = Object.fromEntries(
      Object.entries(map).filter(([, createdAt]) => now - createdAt <= PENDING_DELETE_WINDOW_MS),
    );

    if (Object.keys(pruned).length !== Object.keys(map).length) this.writePendingDeleteMap(pruned);
    return pruned;
  }
}
