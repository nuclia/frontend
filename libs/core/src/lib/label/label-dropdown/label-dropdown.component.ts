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
})
export class LabelDropdownComponent {
  @Input() aspect: Aspect = 'solid';
  @Input() labelSets?: LabelSets | null;
  @Input({ transform: booleanAttribute }) labelSetSelection = false;
  @Input({ transform: booleanAttribute }) single = false;
  @Input({ transform: booleanAttribute }) fullWidth = false;
  @Input() size: Size = 'medium';
  @Input()
  set selection(value: Classification[]) {
    this._selection = [...value] || [];
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

  labelSetExpanded = '';
  labelValues: Classification[] = [];
  open = false;
  checkboxSelection: string[] = [];

  onLevel1Selection(labelSetType: string, labelSet: LabelSet) {
    if (this.labelSetSelection && this.single) {
      this.labelSetSelected.emit({ id: labelSetType, labelSet });
    } else {
      this.labelSetExpanded = labelSetType;
      this.level2Popup?.close();
      this.labelValues = labelSet.labels.map((label) => ({ labelset: labelSetType, label: label.title }));
    }
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
      const isMultiple = this.labelSets[labelValue.labelset]?.multiple;
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
    if (this.single) {
      this.selection = [labelValue];
      this.selectionChange.emit(this.selection);
    } else if ((event.target as HTMLElement).tagName === 'LI') {
      this.toggleLabel(labelValue);
    }
  }
}
