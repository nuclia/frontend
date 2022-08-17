import { Component } from '@angular/core';
import { RouteInfo } from '@flaps/common';

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
  routes = ROUTES;

  constructor() {}
}
