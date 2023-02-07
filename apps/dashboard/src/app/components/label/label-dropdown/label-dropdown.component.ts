import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { Classification, LabelSet, LabelSets } from '@nuclia/core';
import { Aspect, PopupComponent, Size } from '@guillotinaweb/pastanaga-angular';
import { coerceBooleanProperty } from '@angular/cdk/coercion';

@Component({
  selector: 'app-label-dropdown',
  templateUrl: './label-dropdown.component.html',
  styleUrls: ['./label-dropdown.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabelDropdownComponent {
  @Input()
  set aspect(value: Aspect) {
    this._aspect = value;
  }
  get aspect() {
    return this._aspect;
  }
  private _aspect: Aspect = 'solid';

  @Input()
  set selection(value: Classification[]) {
    this._selection = [...value] || [];
    this.checkboxSelection = this._selection.map((labelValue) => `${labelValue.labelset}${labelValue.label}`);
  }
  get selection() {
    return this._selection;
  }

  @Input()
  set labelSets(value: LabelSets) {
    if (value) {
      this._labelSets = value;
    }
  }
  get labelSets() {
    return this._labelSets;
  }

  @Input()
  set single(value: any) {
    this._single = coerceBooleanProperty(value);
  }
  get single() {
    return this._single;
  }

  @Input() size: Size | undefined;

  @Output() selectionChange = new EventEmitter<Classification[]>();
  @Output() close = new EventEmitter<void>();

  @ViewChild('level2', { read: ElementRef }) level2Element?: ElementRef;
  @ViewChild('level2') level2Popup?: PopupComponent;

  labelSetExpanded = '';
  labelValues: Classification[] = [];
  open: boolean = false;
  checkboxSelection: string[] = [];

  private _selection: Classification[] = [];
  private _labelSets: LabelSets = {};
  private _single = false;

  onLevel1Selection(labelSetType: string, labelSet: LabelSet) {
    this.labelSetExpanded = labelSetType;
    this.level2Popup?.close();
    this.labelValues = labelSet.labels.map((label) => ({ labelset: labelSetType, label: label.title }));
  }

  closeDropdowns() {
    this.open = false;
    this.level2Popup?.close();
    this.labelSetExpanded = '';
    this.close.emit();
  }

  toggleLabel(labelValue: Classification) {
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

  onOptionSelection(labelValue: Classification) {
    if (this.single) {
      this.selection = [labelValue];
      this.selectionChange.emit(this.selection);
    }
  }
}
