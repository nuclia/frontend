import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { SDKService } from '@flaps/core';
import { inject } from '@angular/core';
import { map, of } from 'rxjs';

export const setLocalKbGuard = (route: ActivatedRouteSnapshot) => {
  const sdk: SDKService = inject(SDKService);
  const router: Router = inject(Router);

  const accountSlug = route.paramMap.get('account');
  const kbId = route.paramMap.get('kb');

  if (!accountSlug || !kbId) {
    return of(router.createUrlTree(['/select']));
  }

  // we provide account slug instead of id, but it doesn't matter as it is not used to get the KB on standalone mode
  return sdk.setCurrentKnowledgeBox(accountSlug, kbId).pipe(map(() => true));
};
