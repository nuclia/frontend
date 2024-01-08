import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { inject } from '@angular/core';
import { SDKService, UserService } from '@flaps/core';
import { filter, forkJoin, map, Observable, of, switchMap, take } from 'rxjs';
import { WelcomeUser } from '@nuclia/core';

export const inviteGuard = (route: ActivatedRouteSnapshot) => {
  const sdk: SDKService = inject(SDKService);
  const user: UserService = inject(UserService);
  const router: Router = inject(Router);

  return forkJoin([
    getSlugs(sdk, route.queryParams['account'], route.queryParams['kb']),
    user.userPrefs.pipe(
      filter((prefs) => !!prefs),
      map((prefs) => prefs as WelcomeUser),
      take(1),
    ),
  ]).pipe(
    map(([slugs, prefs]) => {
      const isNewUser = !prefs.last_login;
      if (isNewUser) {
        return true;
      } else {
        const path = slugs.kbSlug
          ? `/at/${slugs.accountSlug}/${slugs.zone}/${slugs.kbSlug}`
          : `/select/${slugs.accountSlug}`;
        return router.createUrlTree([path]);
      }
    }),
  );
};

function getSlugs(
  sdk: SDKService,
  accountId: string,
  kbId?: string,
): Observable<{
  accountSlug: string;
  kbSlug?: string;
  zone?: string;
}> {
  return sdk.nuclia.db.getAccounts().pipe(
    map((accounts) => accounts.find((account) => account.id === accountId)?.slug),
    switchMap((accountSlug) => {
      if (!accountSlug) throw new Error();
      if (kbId) {
        return sdk.nuclia.db.getKnowledgeBoxes(accountSlug, accountId).pipe(
          map((kbs) => {
            const kb = kbs.find((kb) => kb.id === kbId);
            return {
              accountSlug,
              kbSlug: kb?.slug,
              zone: kb?.zone,
            };
          }),
        );
      } else {
        return of({ accountSlug, kbSlug: undefined });
      }
    }),
  );
}
