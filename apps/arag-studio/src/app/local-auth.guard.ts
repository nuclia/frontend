import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService, SDKService } from '@flaps/core';

const LOCALSTORAGE_AUTH_KEY = 'JWT_KEY';

/**
 * Wraps the standard authGuard with a fallback for local development:
 * when OAuth is not configured (no oauth.client_id in app-config.json),
 * redirects to /user/local-login instead of throwing.
 */
export const localAuthGuard = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const sdk = inject(SDKService);
  const router = inject(Router);

  if (localStorage.getItem(LOCALSTORAGE_AUTH_KEY) || routeHasMagicToken()) {
    return true;
  }

  const url = state.url.split('?')[0];
  const queryParams = { ...route.queryParams };
  authService.setNextParams(queryParams);
  authService.setNextUrl(url);
  sessionStorage.setItem('nextUrl', url);

  try {
    sdk.nuclia.auth.redirectToOAuth(queryParams);
    return false;
  } catch {
    // OAuth not configured — fall back to local dev token-entry page
    return router.parseUrl('/user/local-login');
  }
};

function routeHasMagicToken(): boolean {
  const params = new URLSearchParams(window.location.search);
  return params.has('token') && !params.has('signup_token');
}
