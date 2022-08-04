import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Labels, LabelValue } from '@nuclia/core';

@Component({
  selector: 'app-label-list',
  templateUrl: './label-list.component.html',
  styleUrls: ['./label-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabelListComponent {
  @Input() labelSets: Labels = {};
  @Input() labelSelection: LabelValue[] = [];

  @Output() labelSelectionChange: EventEmitter<LabelValue[]> = new EventEmitter<LabelValue[]>();

  removeLabel(labelValue: LabelValue) {
    const newSelection = this.labelSelection.filter(
      (item) => !(item.label === labelValue.label && item.labelset === labelValue.labelset),
    );
    this.labelSelectionChange.emit(newSelection);
  }
}
