import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, UrlTree, Router } from '@angular/router';
import { Observable, combineLatest, map, switchMap, of, filter, take } from 'rxjs';
import { UserService, SDKService } from '@flaps/auth';

@Injectable({
  providedIn: 'root',
})
export class InviteGuard implements CanActivate {
  constructor(private sdk: SDKService, private user: UserService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> {
    return combineLatest([
      this.getSlugs(route.queryParams.account, route.queryParams.kb),
      this.user.userPrefs.pipe(filter((prefs) => !!prefs)),
    ]).pipe(
      take(1),
      map(([slugs, prefs]) => {
        const isNewUser = prefs!.last_login;
        if (isNewUser) {
          return true;
        } else {
          const path = `/at/${slugs.accountSlug}` + (slugs.kbSlug ? `/${slugs.kbSlug}` : '');
          return this.router.createUrlTree([path]);
        }
      }),
    );
  }

  getSlugs(accountId: string, kbId?: string) {
    return this.sdk.nuclia.db.getAccounts().pipe(
      map((accounts) => accounts.find((account) => account.id === accountId)?.slug),
      switchMap((accountSlug) => {
        if (!accountSlug) throw new Error();
        if (kbId) {
          return this.sdk.nuclia.db.getKnowledgeBoxes(accountSlug!).pipe(
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
}
