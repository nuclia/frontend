import { Component, OnInit} from '@angular/core';
import { RouteInfo } from '@flaps/common';

@Component({
  selector: 'app-knowledge-box-manage',
  templateUrl: './knowledge-box-manage.component.html'
})
export class KnowledgeBoxManageComponent implements OnInit {

  routes: RouteInfo[] = [ 
    {
      title: 'generic.profile',
      relativeRoute: 'profile',
    }
  ];

  constructor() { }

  ngOnInit(): void {}
}