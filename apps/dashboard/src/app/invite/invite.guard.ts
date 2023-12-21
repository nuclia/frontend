import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { inject } from '@angular/core';
import { SDKService, UserService } from '@flaps/core';
import { combineLatest, filter, map, of, switchMap, take } from 'rxjs';

export const inviteGuard = (route: ActivatedRouteSnapshot) => {
  const sdk: SDKService = inject(SDKService);
  const user: UserService = inject(UserService);
  const router: Router = inject(Router);

  return combineLatest([
    getSlugs(sdk, route.queryParams['account'], route.queryParams['kb']),
    user.userPrefs.pipe(filter((prefs) => !!prefs)),
  ]).pipe(
    take(1),
    map(([slugs, prefs]) => {
      const isNewUser = !prefs!.last_login;
      if (isNewUser) {
        return true;
      } else {
        const path = slugs.kbSlug ? `/at/${slugs.accountSlug}/${slugs.kbSlug}` : `/select/${slugs.accountSlug}`;
        return router.createUrlTree([path]);
      }
    }),
  );
};

function getSlugs(sdk: SDKService, accountId: string, kbId?: string) {
  return sdk.nuclia.db.getAccounts().pipe(
    map((accounts) => accounts.find((account) => account.id === accountId)?.slug),
    switchMap((accountSlug) => {
      if (!accountSlug) throw new Error();
      if (kbId) {
        return sdk.nuclia.db.getKnowledgeBoxes(accountSlug).pipe(
          map((kbs) => ({
            accountSlug,
            kbSlug: kbs.find((kb) => kb.id === kbId)?.slug,
          })),
        );
      } else {
        return of({ accountSlug, kbSlug: undefined });
      }
    }),
  );
}
