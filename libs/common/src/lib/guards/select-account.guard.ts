import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { inject } from '@angular/core';
import { SelectAccountKbService } from '@flaps/common';
import { catchError, of, switchMap } from 'rxjs';
import { map } from 'rxjs/operators';

export const selectAccountGuard = (route: ActivatedRouteSnapshot) => {
  const selectService: SelectAccountKbService = inject(SelectAccountKbService);
  const router: Router = inject(Router);

  const selectedAccount = route.children[0]?.paramMap.get('account');

  if (selectedAccount) {
    // when loading `/select/{account}` (happens when there is only 1 account and when we reload the KB selection page)
    // set account in state and continue
    return selectService.accounts.pipe(
      switchMap((accounts) => {
        const selectAccount$ = selectService.selectAccount(selectedAccount);
        if (!accounts) {
          // on reload, we need to load accounts list
          return selectService.loadAccounts().pipe(switchMap(() => selectAccount$));
        } else {
          return selectAccount$;
        }
      }),
      map(() => true),
    );
  }
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
