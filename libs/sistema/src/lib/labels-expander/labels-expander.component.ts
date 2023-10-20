import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { LabelSets } from '@nuclia/core';
import { PaExpanderModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  imports: [PaExpanderModule, CommonModule, PaTogglesModule],
  selector: 'nsi-labels-expander',
  templateUrl: './labels-expander.component.html',
  styleUrls: ['./labels-expander.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabelsExpanderComponent {
  @Input() currentSelection: { [id: string]: boolean } = {};
  @Input() labelSets?: LabelSets | null;

  @Output() updateSelection = new EventEmitter<{ [id: string]: boolean }>();

  onSelection(data: { labelset: string; label: string; selected: boolean }) {
    if (!data.selected) {
      this.updateSelection.emit({
        ...this.currentSelection,
        [`${data.labelset}_${data.label}`]: false,
      });
    } else if (this.labelSets) {
      const labelSet = this.labelSets[data.labelset];
      if (labelSet.multiple) {
        this.updateSelection.emit({
          ...this.currentSelection,
          [`${data.labelset}_${data.label}`]: true,
        });
      } else {
        // reset selected label of this label set
        const newSelection: { [id: string]: boolean } = Object.entries(this.currentSelection).reduce(
          (selection, [labelId, selected]) => {
            const [key, label] = labelId.split('_');
            if (key !== data.labelset) {
              selection[labelId] = selected;
            } else {
              selection[labelId] = label === data.label;
            }
            return selection;
          },
          {} as { [id: string]: boolean },
        );
        newSelection[`${data.labelset}_${data.label}`] = true;
        this.updateSelection.emit(newSelection);
      }
    }
  }
}
