import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { Aspect, PopupComponent, Size } from '@guillotinaweb/pastanaga-angular';
import { Classification, LabelSet, LabelSets } from '@nuclia/core';

@Component({
  selector: 'app-label-dropdown',
  templateUrl: './label-dropdown.component.html',
  styleUrls: ['./label-dropdown.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class LabelDropdownComponent {
  @Input() aspect: Aspect = 'solid';
  @Input({ required: true }) labelSets?: LabelSets | null;
  @Input({ transform: booleanAttribute }) disabled = false;
  /**
   * when true, selection is done at label set level (useful on widget filters for example)
   */
  @Input({ transform: booleanAttribute }) labelSetSelection = false;
  /**
   * when true, don't display checkboxes and close the dropdown when clicking on a label option.
   */
  @Input({ transform: booleanAttribute }) single = false;
  /**
   * when true, the selected label is added to the selection even if the label set is configured with `multiple=false`
   *  (this is useful when using label dropdown for filtering the resource list for example).
   * when false, for the label sets configured with `multiple=false`, we make sure there is no more than one label from this label set in the selection
   *  (option by default, necessary when using the dropdown to add labels)
   *
   * when both single and multiple are false, we display a radio instead of a checkbox for selection of label from sets configured with `multiple=false`
   */
  @Input({ transform: booleanAttribute }) multiple = false;
  @Input({ transform: booleanAttribute }) fullWidth = false;
  @Input() size: Size = 'medium';
  @Input()
  set selection(value: Classification[]) {
    this._selection = [...value];
    this.checkboxSelection = this._selection.map((labelValue) => `${labelValue.labelset}${labelValue.label}`);
  }
  get selection() {
    return this._selection;
  }
  private _selection: Classification[] = [];
  @Input() selectedLabelSet?: string;

  @Output() selectionChange = new EventEmitter<Classification[]>();
  @Output() labelSetSelected = new EventEmitter<{ id: string; labelSet: LabelSet }>();
  @Output() close = new EventEmitter<void>();

  @ViewChild('level2', { read: ElementRef }) level2Element?: ElementRef;
  @ViewChild('level2') level2Popup?: PopupComponent;

  labelSetExpandedId = '';
  labelSetExpanded?: LabelSet;
  labelSetInSelection = false;
  labelValues: Classification[] = [];
  open = false;
  checkboxSelection: string[] = [];
  filter = '';
  filteredLabels?: Classification[];
  maxLabels = 100;
  radioValue = '';

  onLevel1Selection(labelSetType: string, labelSet: LabelSet) {
    if (!this.labelSets) {
      return;
    }
    if (this.labelSetSelection && this.single) {
      this.labelSetSelected.emit({ id: labelSetType, labelSet });
    } else {
      this.labelSetExpandedId = labelSetType;
      this.labelSetExpanded = this.labelSets[labelSetType];
      this.level2Popup?.close();
      this.labelValues = labelSet.labels.map((label) => ({ labelset: labelSetType, label: label.title }));
      this.setRadioModel(labelSetType);
    }
    this.filter = '';
    this.filteredLabels = undefined;
  }

  closeDropdowns() {
    this.open = false;
    this.level2Popup?.close();
    this.labelSetExpandedId = '';
    this.labelSetExpanded = undefined;
    this.labelSetInSelection = false;
    this.radioValue = '';
    this.close.emit();
  }

  private setRadioModel(labelSetType: string) {
    if (!!this.labelSetExpanded && !this.labelSetExpanded.multiple) {
      const selectedLabel = this.selection.find((label) => label.labelset === labelSetType);
      this.labelSetInSelection = !!selectedLabel;
      this.radioValue = !!selectedLabel ? `${selectedLabel.labelset}${selectedLabel.label}` : '';
    }
  }

  toggleLabel(labelValue: Classification) {
    if (!this.labelSets) {
      return;
    }

    const checkboxValue = `${labelValue.labelset}${labelValue.label}`;
    let newSelectedLabels;

    if (!this.checkboxSelection.includes(checkboxValue)) {
      const isMultiple = this.labelSets[labelValue.labelset]?.multiple || this.multiple;
      newSelectedLabels = isMultiple
        ? this.selection.concat([labelValue])
        : this.selection.filter((item) => item.labelset !== labelValue.labelset).concat([labelValue]);
    } else {
      newSelectedLabels = this.selection.filter(
        (item) => !(item.label === labelValue.label && item.labelset === labelValue.labelset),
      );
    }
    this.selection = newSelectedLabels;
    this.setRadioModel(labelValue.labelset);
    this.selectionChange.emit(newSelectedLabels);
  }

  toggleRadio(labelValue: Classification, $event: { value: string; checked: boolean }) {
    if ($event.value === `${labelValue.labelset}${labelValue.label}`) {
      this.toggleLabel(labelValue);
    }
  }

  resetRadio(labelSet: string, event: MouseEvent | KeyboardEvent) {
    this.selection = this.selection.filter((label) => label.labelset !== labelSet);
    this.labelSetInSelection = false;
    this.selectionChange.emit(this.selection);
    if ((event.target as HTMLElement).tagName === 'LI') {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  onOptionSelection(labelValue: Classification, event: MouseEvent | KeyboardEvent) {
    if (this.single) {
      this.selection = [labelValue];
      this.selectionChange.emit(this.selection);
    } else {
      event.preventDefault();
      event.stopPropagation();
      this.toggleLabel(labelValue);
    }
  }

  filterLabels(labelset: string) {
    if (this.filter.length <= 2) {
      this.filteredLabels = undefined;
    } else {
      this.filteredLabels = (this.labelSets?.[labelset].labels || [])
        .filter((label) => label.title.toLowerCase().includes(this.filter.toLowerCase()))
        .map((label) => ({ labelset, label: label.title }));
    }
  }
}
