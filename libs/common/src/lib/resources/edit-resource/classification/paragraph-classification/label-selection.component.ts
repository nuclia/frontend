import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Classification } from '@nuclia/core';

@Component({
  selector: 'stf-label-selection',
  templateUrl: './label-selection.component.html',
  styleUrls: ['./label-selection.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabelSelectionComponent {
  @Input()
  set selection(value: Classification[]) {
    this._labelMap = value.reduce((map, classification: Classification) => {
      if (!map[classification.labelset]) {
        map[classification.labelset] = [classification.label];
      } else {
        map[classification.labelset].push(classification.label);
        map[classification.labelset].sort();
      }
      return map;
    }, {} as { [set: string]: string[] });
  }

  @Output() removeFromSelection: EventEmitter<Classification> = new EventEmitter<Classification>();

  get labelMap() {
    return this._labelMap;
  }

  private _labelMap: { [set: string]: string[] } = {};

  removeLabelFromSelection(key: string, label: string) {
    this.removeFromSelection.emit({ labelset: key, label });
  }
}
