import { inject } from '@angular/core';
import { BackendConfigurationService, getSafeRedirectOrigin, OAuthService } from '@flaps/core';

/**
 * Catch-all guard for the `**` wildcard route. Instead of showing a dead-end 404 page,
 * redirects the user to the main app (rag/dashboard) preserving the original path and
 * query parameters. The auth app is a pure authentication gateway — any route that doesn't
 * match a known auth flow likely belongs to the dashboard or rao app.
 *
 * Handles cases like:
 * - `/user/login-redirect` (authGuard redirect that only exists in dashboard)
 * - `/user/onboarding` (selectAccountGuard redirect)
 * - `/user/set-password` (invite flow)
 * - `/at/:account/...` (account routes)
 * - Any other stale bookmarks or browser autocomplete entries
 *
 * Security: `cameFrom` is read from localStorage and validated against the backend domain
 * before use. If validation fails the guard returns true, allowing the 404 page to render —
 * no guessed fallback URLs are constructed.
 */
export const fallbackRedirectGuard = () => {
  const oauthService = inject(OAuthService);
  const config = inject(BackendConfigurationService);
  const cameFrom = oauthService.getCameFrom();
  const safeOrigin = getSafeRedirectOrigin(cameFrom, config.getAPIOrigin());
  if (!safeOrigin) {
    // cameFrom failed validation — show the 404 page rather than guessing a redirect target
    return true;
  }
  const redirectUrl = new URL(safeOrigin);
  redirectUrl.pathname = window.location.pathname;
  redirectUrl.search = window.location.search;
  window.location.href = redirectUrl.toString();
  return false;
};
