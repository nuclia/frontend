import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Observable } from 'rxjs';
import { LabelSetKind } from '@nuclia/core';
import { map } from 'rxjs/operators';
import { LabelsService } from '../labels.service';
import { LabelSetDisplay } from './model';
import { FeaturesService } from '@flaps/core';

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
  selectionLabelSets: Observable<LabelSetDisplay[]> = this._labelSets.pipe(
    map((labelSets) => labelSets.filter((labelSet) => labelSet.kind.includes(LabelSetKind.SELECTIONS))),
  );

  isAdminOrContrib = this.features.isKbAdminOrContrib;

  constructor(
    private labelsService: LabelsService,
    private features: FeaturesService,
  ) {}
}
