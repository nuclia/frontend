import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { SDKService } from '@flaps/core';
import { inject } from '@angular/core';
import { map, of } from 'rxjs';
import { NavigationService } from '@flaps/common';

export const setLocalKbGuard = (route: ActivatedRouteSnapshot) => {
  const sdk: SDKService = inject(SDKService);
  const router: Router = inject(Router);
  const navigation: NavigationService = inject(NavigationService);

  const accountSlug = route.paramMap.get('account');
  const kbId = route.paramMap.get('kb');

  if (!accountSlug || !kbId) {
    return of(router.createUrlTree(['/select']));
  }

  return sdk.setCurrentKnowledgeBox(accountSlug, kbId).pipe(map(() => true));
};
