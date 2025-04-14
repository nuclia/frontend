import { inject } from '@angular/core';
import { ActivatedRouteSnapshot } from '@angular/router';
import { FeaturesService } from '@flaps/core';

export const setAgentGuard = (route: ActivatedRouteSnapshot) => {
  const features = inject(FeaturesService);
  const isRetrievalAgentsEnabled = features.unstable.retrievalAgents;
  //TODO agent guard with real permissions
  return isRetrievalAgentsEnabled;
};
