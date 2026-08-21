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
   * when true, don't display checkboxes and close the dropdown when clicking on a label option.
   */
  @Input({ transform: booleanAttribute }) single = false;
  /**
   * when true, the selected label is added to the selection even if the label set is configured with `multiple=false`
   *  (this is useful when using label dropdown for filtering the resource list for example).
   * when false, for the label sets configured with `multiple=false`, we make sure there is no more than one label from this label set in the selection
   *  (option by default, necessary when using the dropdown to add labels)
   */
  @Input({ transform: booleanAttribute }) multiple = false;
  /**
   * display a radio instead of a checkbox for options of label sets configured with `multiple=false`.
   * If single is set to true, it will take precedence over this option.
   */
  @Input({ transform: booleanAttribute }) displayRadioForNonMultiple = false;
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

  @Input({ transform: booleanAttribute }) selectLabelsets = false;
  @Input()
  set labelsetSelection(value: string[]) {
    this._labelsetSelection = [...value];
  }
  get labelsetSelection() {
    return this._labelsetSelection;
  }
  private _labelsetSelection: string[] = [];

  @Output() selectionChange = new EventEmitter<Classification[]>();
  @Output() labelsetSelectionChange = new EventEmitter<string[]>();
  @Output() dropdownClose = new EventEmitter<void>();

  @ViewChild('level2', { read: ElementRef }) level2Element?: ElementRef;
  @ViewChild('level2') level2Popup?: PopupComponent;

  labelSetExpandedId = '';
  labelSetExpanded?: LabelSet;
  labelValues: Classification[] = [];
  open = false;
  checkboxSelection: string[] = [];
  filter = '';
  filteredLabels?: Classification[];
  maxLabels = 100;
  radioValue = '';

  onLevel1Selection(labelSetType: string, labelSet: LabelSet, event: MouseEvent | KeyboardEvent) {
    if (!this.labelSets) {
      return;
    }
    this.labelSetExpandedId = labelSetType;
    this.labelSetExpanded = this.labelSets[labelSetType];
    this.level2Popup?.close();
    this.labelValues = labelSet.labels.map((label) => ({ labelset: labelSetType, label: label.title }));
    this.setRadioModel(labelSetType);
    this.filter = '';
    this.filteredLabels = undefined;
  }

  closeDropdowns() {
    this.open = false;
    this.level2Popup?.close();
    this.labelSetExpandedId = '';
    this.labelSetExpanded = undefined;
    this.radioValue = '';
    this.dropdownClose.emit();
  }

  private setRadioModel(labelSetType: string) {
    if (!!this.labelSetExpanded && !this.labelSetExpanded.multiple) {
      const selectedLabel = this.selection.find((label) => label.labelset === labelSetType);
      this.radioValue = selectedLabel ? `${selectedLabel.labelset}${selectedLabel.label}` : '';
    }
  }

  setLabelsetSelection(labelset: string, selected: boolean) {
    this.labelsetSelection = selected
      ? [...this.labelsetSelection, labelset]
      : this.labelsetSelection.filter((item) => item !== labelset);

    if (selected) {
      const newSelectedLabels = this.selection.filter((label) => label.labelset !== labelset);
      if (newSelectedLabels.length !== this.selection.length) {
        this.selection = newSelectedLabels;
        this.selectionChange.emit(newSelectedLabels);
      }
    }
    this.labelsetSelectionChange.emit(this.labelsetSelection);
    this.closeDropdowns();
  }

  toggleLabel(labelValue: Classification) {
    if (!this.labelSets) {
      return;
    }

    const checkboxValue = `${labelValue.labelset}${labelValue.label}`;
    let newSelectedLabels;

    if (this.checkboxSelection.includes(checkboxValue)) {
      newSelectedLabels = this.selection.filter(
        (item) => !(item.label === labelValue.label && item.labelset === labelValue.labelset),
      );
    } else {
      const isMultiple = this.labelSets[labelValue.labelset]?.multiple || this.multiple;
      newSelectedLabels = isMultiple
        ? this.selection.concat([labelValue])
        : this.selection.filter((item) => item.labelset !== labelValue.labelset).concat([labelValue]);
    }
    this.selection = newSelectedLabels;
    this.setRadioModel(labelValue.labelset);
    this.selectionChange.emit(newSelectedLabels);
  }

  onOptionSelection(labelValue: Classification, event: MouseEvent | KeyboardEvent) {
    if (this.single) {
      this.selection = [labelValue];
      this.selectionChange.emit(this.selection);
    } else if ((event.target as HTMLElement).tagName !== 'INPUT') {
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
