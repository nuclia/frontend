import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { LabelSets } from '@nuclia/core';

@Component({
  selector: 'stf-labels-expander',
  templateUrl: './labels-expander.component.html',
  styleUrls: ['./labels-expander.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabelsExpanderComponent {
  @Input() currentSelection: { [id: string]: boolean } = {};
  @Input() labelSets?: LabelSets | null;

  @Output() updateSelection = new EventEmitter<{ selected: boolean; labelset: string; label: string }>();
}
