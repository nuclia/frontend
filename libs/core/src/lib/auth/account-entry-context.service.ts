import { inject, Injectable } from '@angular/core';
import { BackendConfigurationService } from '../config';
import { SDKService } from '../api';
import { getSafeRedirectOrigin } from '../utils';

export const ACCOUNT_ENTRY_CONTEXT_KEY = 'ACCOUNT_APP_ENTRY_CONTEXT';

const KNOWN_ORIGIN_CLIENTS = ['rao', 'platform', 'dashboard'] as const;
export type AccountEntryOriginClient = (typeof KNOWN_ORIGIN_CLIENTS)[number];

export interface AccountEntryContext {
  returnUrl: string;
  originClient: AccountEntryOriginClient;
}

/** Own localStorage key, separate from `OAuthService`'s `SIGNUP_CAME_FROM`, which gets
 *  clobbered on every `/user/login` load. */
@Injectable({
  providedIn: 'root',
})
export class AccountEntryContextService {
  private sdk = inject(SDKService);
  private config = inject(BackendConfigurationService);

  /** `from` must pass `getSafeRedirectOrigin` before being stored — it's a query param, so an
   *  unvalidated value would be an open-redirect risk. */
  captureFromQueryParams(from: string | null, app: string | null): void {
    if (!from) {
      return;
    }
    const safeOrigin = getSafeRedirectOrigin(from, this.config.getAPIOrigin());
    if (!safeOrigin) return;

    const returnUrl = new URL(from, safeOrigin);
    const originClient: AccountEntryOriginClient = (KNOWN_ORIGIN_CLIENTS as readonly string[]).includes(app || '')
      ? (app as AccountEntryOriginClient)
      : 'dashboard';
    const context: AccountEntryContext = { returnUrl: returnUrl.toString(), originClient };
    localStorage.setItem(ACCOUNT_ENTRY_CONTEXT_KEY, JSON.stringify(context));
  }

  get(): AccountEntryContext | null {
    const raw = localStorage.getItem(ACCOUNT_ENTRY_CONTEXT_KEY);
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed?.returnUrl === 'string' && KNOWN_ORIGIN_CLIENTS.includes(parsed?.originClient)) {
        return parsed as AccountEntryContext;
      }
      return null;
    } catch {
      return null;
    }
  }

  /** Falls back to dashboard's own origin if nothing (valid) was ever captured. */
  getReturnUrl(): string {
    return this.get()?.returnUrl || this.sdk.getOriginForApp('rag');
  }
}
