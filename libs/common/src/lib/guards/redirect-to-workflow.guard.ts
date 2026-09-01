import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { filter, map, switchMap, take } from 'rxjs';
import { WorkflowsService } from '../retrieval-agent';
import { NavigationService } from '@flaps/core';

/**
 * Landing on an agent (e.g. `/at/:account/:zone/arag/:agent`) skips the workflows list and
 * goes straight to a workflow canvas: the last one the user worked on if there is one, otherwise
 * the `default` workflow every agent is seeded with. Falls back to the workflows list itself only
 * if the agent somehow has no workflows at all.
 *
 * This only applies to the bare agent entry point, not to explicit navigation to `/workflows`
 * (e.g. the canvas' "Back to workflows list" button), which must always show the list.
 */
export const redirectToWorkflowGuard = (route: ActivatedRouteSnapshot) => {
  const router: Router = inject(Router);
  const workflowsService: WorkflowsService = inject(WorkflowsService);
  const navigationService = inject(NavigationService);

  const accountSlug = route.paramMap.get('account') || '';
  const agentSlug = route.paramMap.get('agent') || '';

  return workflowsService.loadingWorkflows.pipe(
    filter((loading) => !loading),
    switchMap(() => workflowsService.workflows.pipe(take(1))),
    map((workflows) => {
      const lastWorkflowId = workflowsService.getLastWorkflowId(agentSlug) || 'default';
      const targetId =
        lastWorkflowId && workflows.some((workflow) => workflow.id === lastWorkflowId) ? lastWorkflowId : undefined;
      return router.parseUrl(
        `${navigationService.getRetrievalAgentUrl(accountSlug, agentSlug)}/workflows${targetId ? `/${targetId}` : ''}`,
      );
    }),
  );
};
