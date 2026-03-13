import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

const LOCALSTORAGE_AUTH_KEY = 'JWT_KEY';

export const authGuard = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (localStorage.getItem(LOCALSTORAGE_AUTH_KEY) || routeHasMagicToken()) {
    return true;
  }
  // Store the attempted URL for redirecting
  const url: string = state.url.split('?')[0];
  const queryParams = { ...route.queryParams };
  authService.setNextParams(queryParams);
  authService.setNextUrl(url);

  // Navigate to the login page with extras
  router.navigate(['/user/login-redirect'], { queryParams });
  return false;
};

function routeHasMagicToken(): boolean {
  const params = new URLSearchParams(window.location.search);
  return params.has('token') && !params.has('signup_token');
}
