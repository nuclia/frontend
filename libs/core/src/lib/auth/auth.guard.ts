import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const params = new URLSearchParams(window.location.search);
  const signup_token = params.get('signup_token');
  if (signup_token) {
    authService.setSignUpToken(signup_token);
  }
  const routeHasMagicToken = params.has('token') && !params.has('signup_token');
  if (routeHasMagicToken) {
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
