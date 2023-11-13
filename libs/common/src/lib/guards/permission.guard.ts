import { inject } from '@angular/core';
import { of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { SDKService } from '@flaps/core';
import { NavigationService } from '../services';

export const accountOwnerGuard = (route: ActivatedRouteSnapshot, routerState: RouterStateSnapshot) => {
  const navigation: NavigationService = inject(NavigationService);
  const router: Router = inject(Router);
  const sdk: SDKService = inject(SDKService);

  const slug = routerState.root.firstChild?.firstChild?.paramMap.get('account');
  if (!slug) {
    return of(false);
  } else {
    return sdk
      .setCurrentAccount(slug)
      .pipe(
        switchMap((account) =>
          account.can_manage_account ? of(true) : navigation.homeUrl.pipe(map((url) => router.createUrlTree([url]))),
        ),
      );
  }
};

export const knowledgeBoxOwnerGuard = (route: ActivatedRouteSnapshot, routerState: RouterStateSnapshot) => {
  const navigation: NavigationService = inject(NavigationService);
  const router: Router = inject(Router);
  const sdk: SDKService = inject(SDKService);

  const accountSlug = routerState.root.firstChild?.firstChild?.paramMap.get('account');
  const kbParams = routerState.root.firstChild?.firstChild?.firstChild?.paramMap;
  const kbSlug = kbParams?.get('kb');
  const zone = kbParams?.get('zone') || undefined;
  if (!accountSlug || !kbSlug) {
    return of(false);
  } else {
    return sdk
      .setCurrentKnowledgeBox(accountSlug, kbSlug, zone)
      .pipe(
        switchMap((kb) => (!!kb.admin ? of(true) : navigation.homeUrl.pipe(map((url) => router.createUrlTree([url]))))),
      );
  }
};
