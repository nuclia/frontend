import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { SDKService } from '@flaps/core';
import { inject } from '@angular/core';
import { map, of, switchMap } from 'rxjs';

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
          return sdk.setCurrentKnowledgeBox(account.slug, kb.id, zone);
        }),
      );
    }),
    map(() => true),
  );
};
