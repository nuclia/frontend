import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { LabelValue, LabelSetKind } from '@nuclia/core';
import { map } from 'rxjs';
import { LabelsService } from '../../../services/labels.service';

@Component({
  selector: 'app-label-field',
  templateUrl: './label-field.component.html',
  styleUrls: ['./label-field.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabelFieldComponent {
  @Input() selected: LabelValue[] = [];
  @Input() kind: LabelSetKind = LabelSetKind.RESOURCES;
  @Output() selectedChange = new EventEmitter<LabelValue[]>();

  labelSets = this.labelsService.getLabelsByKind(this.kind);
  hasLabels = this.labelSets.pipe(map((labels) => labels && Object.keys(labels).length > 0));
  open: boolean = false;

  constructor(private labelsService: LabelsService) {}

  setSelected(selected: LabelValue[]) {
    this.selected = selected;
    this.selectedChange.emit(selected);
  }
}
