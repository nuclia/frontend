import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LabelSetKind } from '@nuclia/core';
import { filter, Observable, startWith } from 'rxjs';
import { map } from 'rxjs/operators';
import { LabelsService } from '../labels.service';
import { LabelSetDisplay } from './model';

import { ModalService, PaButtonModule } from '@guillotinaweb/pastanaga-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { FeaturesService } from '../../analytics';
import { LabelSetListComponent } from './label-set-list/label-set-list.component';
import { MissingLabelsDialogComponent } from './missing-labels';

@Component({
  selector: 'app-label-sets',
  templateUrl: './label-sets.component.html',
  styleUrl: './label-sets.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PaButtonModule,
    RouterLink,
    RouterLinkActive,
    LabelSetListComponent,
    RouterOutlet,
    AsyncPipe,
    TranslatePipe,
  ],
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
