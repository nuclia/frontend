import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { FeaturesService, SDKService } from '@flaps/core';
import { of } from 'rxjs';

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

  // this.nuclia.options.zone = zone;
  //TODO agent guard with real permissions
  return !sdk.nuclia.options.standalone && isRetrievalAgentsEnabled;
};
