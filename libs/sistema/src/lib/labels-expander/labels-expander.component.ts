import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Label, LabelSets } from '@nuclia/core';
import { PaExpanderModule, PaTogglesModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { CommonModule } from '@angular/common';
import { getLabelFromSelectionKey, getSelectionKey, LABEL_SEPARATOR } from './classification.helpers';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  imports: [PaExpanderModule, CommonModule, PaTextFieldModule, PaTogglesModule, TranslateModule],
  selector: 'nsi-labels-expander',
  templateUrl: './labels-expander.component.html',
  styleUrls: ['./labels-expander.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabelsExpanderComponent {
  @Input() currentSelection: { [id: string]: boolean } = {};
  @Input() labelSets?: LabelSets | null;

  @Output() updateSelection = new EventEmitter<{ [id: string]: boolean }>();
  LABEL_SEPARATOR = LABEL_SEPARATOR;
  maxLabels = 100;
  filters: { [key: string]: string | undefined } = {};
  filteredLabels: { [key: string]: Label[] | undefined } = {};

  onFilter(labelSet: string, filter: string) {
    this.filters[labelSet] = filter;
    if (filter.length < 2) {
      this.filteredLabels[labelSet] = undefined;
    } else {
      const lowercaseFilter = filter.toLowerCase();
      this.filteredLabels[labelSet] = this.labelSets?.[labelSet].labels.filter(
        (label) => label.title.toLocaleLowerCase().includes(lowercaseFilter),
      );
    }
  }

  onSelection(data: { labelset: string; label: string; selected: boolean }) {
    if (!data.selected) {
      this.updateSelection.emit({
        ...this.currentSelection,
        [getSelectionKey(data.labelset, data.label)]: false,
      });
    } else if (this.labelSets) {
      const labelSet = this.labelSets[data.labelset];
      if (labelSet.multiple) {
        this.updateSelection.emit({
          ...this.currentSelection,
          [getSelectionKey(data.labelset, data.label)]: true,
        });
      } else {
        // reset selected label of this label set
        const newSelection: { [id: string]: boolean } = Object.entries(this.currentSelection).reduce(
          (selection, [labelId, selected]) => {
            const label = getLabelFromSelectionKey(labelId);
            if (label.labelset !== data.labelset) {
              selection[labelId] = selected;
            } else {
              selection[labelId] = label.label === data.label;
            }
            return selection;
          },
          {} as { [id: string]: boolean },
        );
        newSelection[getSelectionKey(data.labelset, data.label)] = true;
        this.updateSelection.emit(newSelection);
      }
    }
  }
}
