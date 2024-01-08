import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { SDKService } from '@flaps/core';
import { inject } from '@angular/core';
import { NavigationService } from '../services';
import { of, switchMap } from 'rxjs';

export const setAccountGuard = (route: ActivatedRouteSnapshot) => {
  const sdk: SDKService = inject(SDKService);
  const router: Router = inject(Router);
  const navigation: NavigationService = inject(NavigationService);

  const accountSlug = route.paramMap.get('account');
  if (!accountSlug) {
    return of(router.createUrlTree(['/select']));
  }

  return sdk.setCurrentAccount(accountSlug).pipe(
    switchMap((account) => {
      sdk.nuclia.options.accountId = account.id;
      return navigation.getAccountUrl(accountSlug);
    }),
  );
};
