import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { LabelValue } from '@nuclia/core';
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
  @Output() selectedChange = new EventEmitter<LabelValue[]>();

  labelSets = this.labelsService.getLabels();
  hasLabels = this.labelSets.pipe(map((labels) => labels && Object.keys(labels).length > 0));
  open: boolean = false;

  constructor(private labelsService: LabelsService) {}

  setSelected(selected: LabelValue[]) {
    this.selected = selected;
    this.selectedChange.emit(selected);
  }
}
