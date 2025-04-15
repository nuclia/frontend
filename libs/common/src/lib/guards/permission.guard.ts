import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { NavigationService, SDKService } from '@flaps/core';
import { of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

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
      .setCurrentKnowledgeBoxFromSlug(accountSlug, kbSlug, zone)
      .pipe(
        switchMap((kb) => (!!kb.admin ? of(true) : navigation.homeUrl.pipe(map((url) => router.createUrlTree([url]))))),
      );
  }
};

export const aragOwnerGuard = (route: ActivatedRouteSnapshot, routerState: RouterStateSnapshot) => {
  const navigation: NavigationService = inject(NavigationService);
  const router: Router = inject(Router);
  const sdk: SDKService = inject(SDKService);

  const accountSlug = routerState.root.firstChild?.firstChild?.paramMap.get('account');
  const aragParams = routerState.root.firstChild?.firstChild?.firstChild?.paramMap;
  const aragSlug = aragParams?.get('agent');
  const zone = aragParams?.get('zone') || undefined;
  if (!accountSlug || !aragSlug) {
    return of(false);
  } else {
    return sdk
      .setCurrentRetrievalAgentFromSlug(accountSlug, aragSlug, zone)
      .pipe(
        switchMap((arag) =>
          !!arag.admin ? of(true) : navigation.homeUrl.pipe(map((url) => router.createUrlTree([url]))),
        ),
      );
  }
};
