import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { map, take } from 'rxjs';
import { WorkflowsService } from '../retrieval-agent';

/**
 * Landing on an agent (e.g. `/at/:account/:zone/arag/:agent`) skips the workflows list and
 * goes straight to a workflow canvas: the last one the user worked on if there is one, otherwise
 * the `default` workflow every agent is seeded with. Falls back to the workflows list itself only
 * if the agent somehow has no workflows at all.
 *
 * This only applies to the bare agent entry point, not to explicit navigation to `/workflows`
 * (e.g. the canvas' "Back to workflows list" button), which must always show the list.
 */
export const redirectToWorkflowGuard = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const router: Router = inject(Router);
  const workflowsService: WorkflowsService = inject(WorkflowsService);

  const agentSlug = route.paramMap.get('agent') || '';
  const basePath = state.url.split(/[?#]/)[0].replace(/\/$/, '');

  return workflowsService.workflows.pipe(
    take(1),
    map((workflows) => {
      const lastWorkflowId = workflowsService.getLastWorkflowId(agentSlug);
      const targetId =
        (lastWorkflowId && workflows.some((workflow) => workflow.id === lastWorkflowId) && lastWorkflowId) ||
        (workflows.some((workflow) => workflow.id === 'default') && 'default') ||
        null;
      return router.parseUrl(`${basePath}/workflows${targetId ? `/${targetId}` : ''}`);
    }),
  );
};
