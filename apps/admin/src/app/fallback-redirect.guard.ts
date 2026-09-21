import { inject } from '@angular/core';
import { BackendConfigurationService, getSafeRedirectOrigin, OAuthService } from '@flaps/core';

/** Catch-all for `**`: `admin` only hosts account pages, so send unknown routes back to
 *  wherever the user came from instead of a dead-end 404. */
export const fallbackRedirectGuard = () => {
  const oauthService = inject(OAuthService);
  const config = inject(BackendConfigurationService);
  const cameFrom = oauthService.getCameFrom();
  const safeOrigin = getSafeRedirectOrigin(cameFrom, config.getAPIOrigin());
  if (!safeOrigin) {
    return true;
  }
  const redirectUrl = new URL(safeOrigin);
  redirectUrl.pathname = window.location.pathname;
  redirectUrl.search = window.location.search;
  window.location.href = redirectUrl.toString();
  return false;
};
