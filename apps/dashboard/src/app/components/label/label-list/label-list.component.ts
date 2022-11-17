import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { LabelSets, Classification } from '@nuclia/core';

@Component({
  selector: 'app-label-list',
  templateUrl: './label-list.component.html',
  styleUrls: ['./label-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabelListComponent {
  @Input() labelSets: LabelSets = {};
  @Input() labelSelection: Classification[] = [];

  @Output() labelSelectionChange: EventEmitter<Classification[]> = new EventEmitter<Classification[]>();

  removeLabel(labelValue: Classification) {
    const newSelection = this.labelSelection.filter(
      (item) => !(item.label === labelValue.label && item.labelset === labelValue.labelset),
    );
    this.labelSelectionChange.emit(newSelection);
  }
}
