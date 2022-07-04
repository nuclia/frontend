import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SDKService } from '@flaps/core';
import { combineLatest, filter, map, switchMap } from 'rxjs';

@Component({
  selector: 'app-edit-resource',
  templateUrl: 'edit-resource.component.html',
  styleUrls: ['edit-resource.component.scss'],
})
export class EditResourceComponent {
  routes = [
    {
      title: 'resource.profile',
      relativeRoute: 'profile',
    },
    {
      title: 'resource.text',
      relativeRoute: 'text',
    },
    {
      title: 'resource.link',
      relativeRoute: 'link',
    },
    {
      title: 'resource.file',
      relativeRoute: 'file',
    },
  ];
  resourceTitle = combineLatest([this.sdk.currentKb, this.route.params.pipe(filter((params) => !!params.id))]).pipe(
    switchMap(([kb, params]) => kb.getResource(params.id)),
    map((res) => res.title),
  );

  constructor(private sdk: SDKService, private route: ActivatedRoute) {}
}
