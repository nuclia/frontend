import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { SDKService, SimpleAccount } from '@flaps/core';
import { SelectAccountKbService } from '../select-account-kb/select-account-kb.service';
import { NavigationService } from '../services';
import { catchError, of } from 'rxjs';

export const selectAccountKbGuard = (route: ActivatedRouteSnapshot) => {
  const selectService: SelectAccountKbService = inject(SelectAccountKbService);
  const navigation: NavigationService = inject(NavigationService);
  const router: Router = inject(Router);
  const sdk: SDKService = inject(SDKService);

  return selectService.refresh().pipe(
    map(({ accounts, kbs }) => {
      // No accounts
      if (accounts.length === 0) {
        return router.createUrlTree(['/user/onboarding']);
      }

      if (accounts.length === 1) {
        const accountSlug = accounts[0].slug;
        sdk.setCurrentAccount(accountSlug).subscribe();
        const numKbs = kbs[accountSlug].length;

        // One account without kbs
        if (numKbs === 0) {
          return router.createUrlTree([navigation.getAccountUrl(accountSlug)]);
        }

        // One account with one kb
        else if (numKbs === 1) {
          const stashSlug = kbs[accountSlug][0].slug!;
          return router.createUrlTree([navigation.getKbUrl(accountSlug, stashSlug)]);
        }

        // One account with multiple kbs
        else {
          if (hasInvalidParams(route, accounts)) {
            return router.createUrlTree(['/select']);
          } else {
            return true;
          }
        }
      }

      if (hasInvalidParams(route, accounts)) {
        return router.createUrlTree(['/select']);
      }
      return true;
    }),
    catchError(() => {
      return of(router.createUrlTree(['/user/logout']));
    }),
  );
};

function hasInvalidParams(route: ActivatedRouteSnapshot, accounts: SimpleAccount[]) {
  const accountSlug = route.firstChild?.paramMap.get('account');
  return !!accountSlug && accounts.every((account) => account.slug !== accountSlug);
}
