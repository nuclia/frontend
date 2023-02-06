import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { LabelsService } from '../services/labels.service';
import { LabelSets } from '@nuclia/core';
import { SDKService } from '@flaps/core';
import { RouteInfo } from '../components/section-navbar';
import { switchMap } from 'rxjs';

@Component({
  selector: 'app-label-sets',
  templateUrl: './label-sets.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabelSetsComponent {
  isAdminOrContrib = this.sdk.currentKb.pipe(map((kb) => !!kb.admin || !!kb.contrib));
  routes = this.isAdminOrContrib.pipe(
    filter((yes) => yes),
    switchMap(() => this.labelsService.labelSets),
    filter((labels) => !!labels),
    map((labels) => this.createRoutes(labels!)),
  );

  constructor(
    private labelsService: LabelsService,
    private router: Router,
    private route: ActivatedRoute,
    private sdk: SDKService,
  ) {}

  createRoutes(labels: LabelSets): RouteInfo[] {
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
