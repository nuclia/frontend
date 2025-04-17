import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { FeaturesService, SDKService } from '@flaps/core';
import { filter, map, of, switchMap, take } from 'rxjs';

export const setAgentGuard = (route: ActivatedRouteSnapshot) => {
  const sdk: SDKService = inject(SDKService);
  const router: Router = inject(Router);
  const features = inject(FeaturesService);
  const isRetrievalAgentsEnabled = features.unstable.retrievalAgents;

  const zone = route.paramMap.get('zone');
  const agentSlug = route.paramMap.get('agent');

  if (!agentSlug || !zone) {
    return of(router.createUrlTree(['/select']));
  }

  return isRetrievalAgentsEnabled.pipe(
    switchMap((enabled) => {
      return !enabled
        ? of(router.createUrlTree(['/select']))
        : sdk.currentAccount.pipe(
            switchMap((account) => {
              return sdk.nuclia.db.getRetrievalAgentsForZone(account.id, zone).pipe(
                switchMap((arags) => {
                  const arag = arags.find((item) => item.slug === agentSlug);
                  if (!arag) {
                    sdk.cleanAccount();
                    return of(router.createUrlTree(['/select']));
                  }
                  sdk.nuclia.options.knowledgeBox = arag.id;
                  return sdk.setCurrentRetrievalAgent(account.id, arag.id, zone);
                }),
              );
            }),
            // Wait until currentArag is updated
            switchMap(() => sdk.currentArag),
            filter((arag) => arag.slug === agentSlug),
            take(1),
            map(() => {
              sdk.isArag = true;
              return true;
            }),
          );
    }),
  );
};
