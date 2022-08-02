import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { RouteInfo } from '@flaps/common';
import { filter, map, switchMapTo } from 'rxjs/operators';
import { LabelsService } from '../services/labels.service';
import { Labels } from '@nuclia/core';
import { SDKService } from '@flaps/core';

@Component({
  selector: 'app-ontologies',
  templateUrl: './ontologies.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OntologiesComponent {
  isAdminOrContrib = this.sdk.currentKb.pipe(map((kb) => !!kb.admin || !!kb.contrib));
  routes = this.isAdminOrContrib.pipe(
    filter((yes) => yes),
    switchMapTo(this.labelsService.labels),
    filter((labels) => !!labels),
    map((labels) => this.createRoutes(labels!)),
  );

  constructor(
    private labelsService: LabelsService,
    private router: Router,
    private route: ActivatedRoute,
    private sdk: SDKService,
  ) {}

  createRoutes(labels: Labels): RouteInfo[] {
    return Object.keys(labels)
      .sort((a: string, b: string) => labels[a].title.localeCompare(labels[b].title))
      .map((key) => ({
        title: labels[key].title,
        relativeRoute: key,
      }));
  }

  addOntology() {
    this.router.navigate(['add'], { relativeTo: this.route });
  }
}
