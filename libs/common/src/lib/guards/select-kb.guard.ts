import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { NavigationService, SelectAccountKbService } from '@flaps/common';
import { inject } from '@angular/core';
import { SDKService } from '@flaps/core';
import { of, switchMap } from 'rxjs';
import { map } from 'rxjs/operators';

export const selectKbGuard = (route: ActivatedRouteSnapshot) => {
  const selectService: SelectAccountKbService = inject(SelectAccountKbService);
  const navigation: NavigationService = inject(NavigationService);
  const sdk: SDKService = inject(SDKService);
  const router: Router = inject(Router);

  const accountSlug = route.paramMap.get('account');

  return accountSlug
    ? selectService.loadKbs(accountSlug).pipe(
        switchMap((kbs) => {
          if (kbs.length === 0) {
            return selectService.standalone
              ? of(true)
              : sdk.currentAccount.pipe(
                  map((account) =>
                    account.can_manage_account ? router.createUrlTree([navigation.getAccountUrl(accountSlug)]) : true,
                  ),
                );
          } else if (kbs.length === 1 && !selectService.standalone) {
            // if there's only one KB, and we're not in NucliaDB admin app, then we automatically select the KB
            return of(router.createUrlTree([navigation.getKbUrl(accountSlug, kbs[0].slug || '')]));
          } else {
            return of(true);
          }
        }),
      )
    : of(router.createUrlTree(['/select']));
};
