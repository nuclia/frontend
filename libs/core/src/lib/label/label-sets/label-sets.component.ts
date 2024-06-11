import { ChangeDetectionStrategy, Component } from '@angular/core';
import { filter, Observable, startWith } from 'rxjs';
import { LabelSetKind } from '@nuclia/core';
import { map } from 'rxjs/operators';
import { LabelsService } from '../labels.service';
import { LabelSetDisplay } from './model';
import { FeaturesService } from '@flaps/core';
import { ModalService } from '@guillotinaweb/pastanaga-angular';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { MissingLabelsDialogComponent } from './missing-labels';

@Component({
  selector: 'app-label-sets',
  templateUrl: './label-sets.component.html',
  styleUrl: './label-sets.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabelSetsComponent {
  private _labelSets: Observable<LabelSetDisplay[]> = this.labelsService.labelSets.pipe(
    map((labelSets) => Object.entries(labelSets || {}).map(([id, labelSet]) => ({ ...labelSet, id }))),
  );

  noLabelSets = this._labelSets.pipe(map((labelSets) => labelSets.length === 0));

  resourceLabelSets: Observable<LabelSetDisplay[]> = this._labelSets.pipe(
    map((labelSets) => labelSets.filter((labelSet) => labelSet.kind.includes(LabelSetKind.RESOURCES))),
  );
  textBlockLabelSets: Observable<LabelSetDisplay[]> = this._labelSets.pipe(
    map((labelSets) => labelSets.filter((labelSet) => labelSet.kind.includes(LabelSetKind.PARAGRAPHS))),
  );
  showingLabelSetForm = this.router.events.pipe(
    filter((event) => event instanceof NavigationEnd),
    startWith(() => true),
    map(() => !this.router.url.endsWith('/label-sets')),
  );

  isAdminOrContrib = this.features.isKbAdminOrContrib;

  constructor(
    private labelsService: LabelsService,
    private features: FeaturesService,
    private modalService: ModalService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  checkMissingLabels() {
    this.modalService.openModal(MissingLabelsDialogComponent, { dismissable: false });
  }
}
