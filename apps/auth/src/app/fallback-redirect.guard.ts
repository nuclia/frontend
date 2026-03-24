import { inject } from '@angular/core';
import { OAuthService } from '@flaps/core';

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
 */
export const fallbackRedirectGuard = () => {
  const oauthService = inject(OAuthService);
  const cameFrom = oauthService.getCameFrom();
  const currentPath = window.location.pathname;
  const queryString = window.location.search;
  window.location.href = `${cameFrom}${currentPath}${queryString}`;
  return false;
};
