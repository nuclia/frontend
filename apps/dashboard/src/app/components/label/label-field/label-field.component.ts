import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { LabelSetKind, Classification } from '@nuclia/core';
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
  set selection(value: Classification[]) {
    this._selection = value || [];
  }
  get selection() {
    return this._selection;
  }
  private _selection: Classification[] = [];

  @Input() kind: LabelSetKind = LabelSetKind.RESOURCES;

  @Output() selectionChange = new EventEmitter<Classification[]>();

  labelSets$ = this.labelsService.getLabelsByKind(this.kind);
  hasLabels = this.labelSets$.pipe(map((labels) => labels && Object.keys(labels).length > 0));

  constructor(private labelsService: LabelsService) {}

  updateSelection($event: Classification[]) {
    this.selection = [...$event];
    this.selectionChange.emit(this.selection);
  }
}
