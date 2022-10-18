import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { LabelSetKind, LabelValue } from '@nuclia/core';
import { map } from 'rxjs';
import { LabelsService } from '../../../services/labels.service';

@Component({
  selector: 'app-label-field',
  templateUrl: './label-field.component.html',
  styleUrls: ['./label-field.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabelFieldComponent {
  @Input()
  set selection(value: LabelValue[]) {
    this._selection = value || [];
  }
  get selection() {
    return this._selection;
  }
  private _selection: LabelValue[] = [];

  @Input() kind: LabelSetKind = LabelSetKind.RESOURCES;

  @Output() selectionChange = new EventEmitter<LabelValue[]>();

  labelSets$ = this.labelsService.getLabelsByKind(this.kind);
  hasLabels = this.labelSets$.pipe(map((labels) => labels && Object.keys(labels).length > 0));

  constructor(private labelsService: LabelsService) {}

  updateSelection($event: LabelValue[]) {
    this.selection = [...$event];
    this.selectionChange.emit(this.selection);
  }
}
