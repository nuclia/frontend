import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { FeaturesService } from '@flaps/core';
import { of } from 'rxjs';

export const agentFeatureEnabledGuard = (route: ActivatedRouteSnapshot) => {
  const features = inject(FeaturesService);
  const router: Router = inject(Router);
  const isRetrievalAgentsEnabled = features.unstable.retrievalAgents;
  return isRetrievalAgentsEnabled || of(router.createUrlTree(['/select']));
};
