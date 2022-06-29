import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { RouteInfo } from '@flaps/common';
import { filter, map } from 'rxjs/operators';
import { LabelsService } from '../services/labels.service';
import { Labels } from '@nuclia/core';

@Component({
  selector: 'app-ontologies',
  templateUrl: './ontologies.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OntologiesComponent {
  routes = this.labelsService.labels.pipe(
    filter((labels) => !!labels),
    map((labels) => this.createRoutes(labels!) )
  );

  constructor(
    private labelsService: LabelsService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  createRoutes(labels: Labels): RouteInfo[] {
    return Object.keys(labels)
      .sort((a: string, b: string) => (
          labels[a].title.localeCompare(labels[b].title)
      ))
      .map((key) => ({
        title: labels[key].title,
        relativeRoute: key
      }));
  }

  addOntology() {
    this.router.navigate(['add'], { relativeTo: this.route });
  }
}