import { Component } from '@angular/core';
import { RouteInfo } from '@flaps/common';
import { PostHogService } from '@flaps/core';
import { map } from 'rxjs';

const ROUTES: RouteInfo[] = [
  {
    title: 'generic.profile',
    relativeRoute: 'profile',
  },
];

@Component({
  selector: 'app-knowledge-box-manage',
  templateUrl: './knowledge-box-manage.component.html',
})
export class KnowledgeBoxManageComponent {
  routes = this.posthog.isFeatureEnabled('training').pipe(
    map((yes) =>
      yes
        ? [
            ...ROUTES,
            {
              title: 'stash.settings.processes',
              relativeRoute: 'processes',
            },
          ]
        : ROUTES,
    ),
  );

  constructor(private posthog: PostHogService) {}
}
