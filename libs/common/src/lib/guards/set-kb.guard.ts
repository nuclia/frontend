import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { SDKService } from '@flaps/core';
import { filter, map, of, switchMap, take } from 'rxjs';

export const setKbGuard = (route: ActivatedRouteSnapshot) => {
  const sdk: SDKService = inject(SDKService);
  const router: Router = inject(Router);

  const kbSlug = route.paramMap.get('kb');
  const zone = route.paramMap.get('zone');

  if (!kbSlug || !zone) {
    return of(router.createUrlTree(['/select']));
  }

  return sdk.currentAccount.pipe(
    switchMap((account) => {
      return sdk.nuclia.db.getKnowledgeBoxesForZone(account.id, zone).pipe(
        switchMap((kbs) => {
          const kb = kbs.find((item) => item.slug === kbSlug);
          if (!kb) {
            sdk.cleanAccount();
            return of(router.createUrlTree(['/select']));
          }
          sdk.nuclia.options.knowledgeBox = kb.id;
          return sdk.setCurrentKnowledgeBox(account.id, kb.id, zone);
        }),
      );
    }),
    // Wait until currentKb is updated
    switchMap(() => sdk.currentKb),
    filter((kb) => kb.slug === kbSlug),
    take(1),
    map(() => {
      sdk.isArag = false;
      sdk.arag = null;
      return true;
    }),
  );
};
