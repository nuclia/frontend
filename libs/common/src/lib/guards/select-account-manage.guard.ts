import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { inject } from '@angular/core';
import { NavigationService } from '@flaps/core';

/**
 * Used by `admin` (account-management-only app) instead of `selectKbGuard`: `admin` has no
 * KB/ARAG pages, so there's nothing to list or auto-select — just redirect straight to the
 * account-manage URL for the account already selected by the parent `selectAccountGuard`.
 */
export const selectAccountManageGuard = (route: ActivatedRouteSnapshot) => {
  const navigation: NavigationService = inject(NavigationService);
  const router: Router = inject(Router);

  const accountSlug = route.paramMap.get('account');
  // Preserve query params (`from`/`app`) so `captureEntryContextGuard` on `/at/:account` still
  // sees them if the user lands here first.
  return accountSlug
    ? router.createUrlTree([navigation.getAccountManageUrl(accountSlug)], { queryParams: route.queryParams })
    : router.createUrlTree(['/select']);
};
