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
import { Classification, LabelSet, LabelSets } from '@nuclia/core';
import { Aspect, PopupComponent, Size } from '@guillotinaweb/pastanaga-angular';

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
  @Input({ transform: booleanAttribute }) forceSingle = false;
  @Input({ transform: booleanAttribute }) forceMultiple = false;
  @Input({ transform: booleanAttribute }) selectAll = false;
  @Input({ transform: booleanAttribute }) fullWidth = false;
  @Input() size: Size = 'medium';
  @Input()
  set selection(value: Classification[]) {
    this._selection = [...value];
    this.checkboxSelection = this._selection.map((labelValue) => `${labelValue.labelset}${labelValue.label}`);
    if (this.selectAll) {
      this.selectedLabelSets = this.getSelectedLabelSets();
    }
  }
  get selection() {
    return this._selection;
  }
  private _selection: Classification[] = [];
  @Input() selectedLabelSet?: string;

  @Output() selectionChange = new EventEmitter<Classification[]>();
  @Output() close = new EventEmitter<void>();

  @ViewChild('level2', { read: ElementRef }) level2Element?: ElementRef;
  @ViewChild('level2') level2Popup?: PopupComponent;

  labelSetExpanded = '';
  labelValues: Classification[] = [];
  open = false;
  checkboxSelection: string[] = [];
  selectedLabelSets: { [key: string]: boolean } = {};
  filter = '';
  filteredLabels?: Classification[];
  maxLabels = 100;

  onLevel1Selection(labelSetType: string, labelSet: LabelSet) {
    this.labelSetExpanded = labelSetType;
    this.level2Popup?.close();
    this.labelValues = labelSet.labels.map((label) => ({ labelset: labelSetType, label: label.title }));
    this.filter = '';
    this.filteredLabels = undefined;
  }

  closeDropdowns() {
    this.open = false;
    this.level2Popup?.close();
    this.labelSetExpanded = '';
    this.close.emit();
  }

  toggleLabel(labelValue: Classification) {
    if (!this.labelSets) {
      return;
    }

    const checkboxValue = `${labelValue.labelset}${labelValue.label}`;
    let newSelectedLabels;

    if (!this.checkboxSelection.includes(checkboxValue)) {
      const isMultiple = this.labelSets[labelValue.labelset]?.multiple || this.forceMultiple;
      newSelectedLabels = isMultiple
        ? this.selection.concat([labelValue])
        : this.selection.filter((item) => item.labelset !== labelValue.labelset).concat([labelValue]);
    } else {
      newSelectedLabels = this.selection.filter(
        (item) => !(item.label === labelValue.label && item.labelset === labelValue.labelset),
      );
    }
    this.selection = newSelectedLabels;
    this.selectionChange.emit(newSelectedLabels);
  }

  onOptionSelection(labelValue: Classification, event: MouseEvent | KeyboardEvent) {
    if (this.forceSingle) {
      this.selection = [labelValue];
      this.selectionChange.emit(this.selection);
    } else if ((event.target as HTMLElement).tagName === 'LI') {
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

  getSelectedLabelSets() {
    return Object.entries(this.labelSets || {}).reduce(
      (acc, [key, labelSet]) => {
        acc[key] = labelSet.labels.every((label) => this.checkboxSelection.includes(`${key}${label.title}`));
        return acc;
      },
      {} as { [key: string]: boolean },
    );
  }

  toggleLabelSet(labelSet: string) {
    if (!this.selectedLabelSets[labelSet]) {
      let newLabels: Classification[] = [];
      (this.labelSets?.[labelSet].labels || []).forEach((label) => {
        if (!this.checkboxSelection.includes(`${labelSet}${label.title}`)) {
          newLabels.push({ labelset: labelSet, label: label.title });
        }
      });
      this.selection = this.selection.concat(newLabels);
    } else {
      this.selection = this.selection.filter((label) => label.labelset !== labelSet);
    }
    this.selectionChange.emit(this.selection);
  }
}
