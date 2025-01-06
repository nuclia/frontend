import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Classification, LabelSets } from '@nuclia/core';

@Component({
  selector: 'app-label-list',
  templateUrl: './label-list.component.html',
  styleUrls: ['./label-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class LabelListComponent {
  @Input() labelSelection: Classification[] = [];
  @Input()
  set labelSets(value: LabelSets | null) {
    if (value) {
      this._labelSets = value;
    }
  }
  get labelSets(): LabelSets {
    return this._labelSets;
  }
  private _labelSets: LabelSets = {};

  @Output() labelSelectionChange: EventEmitter<Classification[]> = new EventEmitter<Classification[]>();

  removeLabel(labelValue: Classification) {
    const newSelection = this.labelSelection.filter(
      (item) => !(item.label === labelValue.label && item.labelset === labelValue.labelset),
    );
    this.labelSelectionChange.emit(newSelection);
  }
}
