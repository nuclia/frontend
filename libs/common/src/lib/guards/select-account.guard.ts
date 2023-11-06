import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { inject } from '@angular/core';
import { SelectAccountKbService } from '@flaps/common';
import { catchError, of, switchMap } from 'rxjs';
import { map } from 'rxjs/operators';

export const selectAccountGuard = (route: ActivatedRouteSnapshot) => {
  const selectService: SelectAccountKbService = inject(SelectAccountKbService);
  const router: Router = inject(Router);

  const selectedAccount = route.children[0]?.paramMap.get('account');

  return selectService.loadAccounts().pipe(
    switchMap((accounts) => {
      // No accounts
      if (accounts.length === 0) {
        return of(router.createUrlTree(['/user/onboarding']));
      } else if (accounts.length === 1) {
        const accountSlug = accounts[0].slug;
        // redirect to kb selection
        return selectService
          .selectAccount(accountSlug)
          .pipe(map((account) => router.createUrlTree([`/select/${accountSlug}`])));
      } else if (selectedAccount) {
        // when loading a `/select/{account}` page directly
        // set account in state and continue
        return selectService.selectAccount(selectedAccount).pipe(map(() => true));
      } else {
        // several accounts, we continue to account selection
        return of(true);
      }
    }),
    catchError(() => {
      return of(router.createUrlTree(['/user/logout']));
    }),
  );
};
