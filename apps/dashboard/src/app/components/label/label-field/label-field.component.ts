import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { LabelSet, LabelSetKind, LabelSets, LabelValue } from '@nuclia/core';
import { map, tap } from 'rxjs';
import { LabelsService } from '../../../services/labels.service';
import { PopupComponent } from '@guillotinaweb/pastanaga-angular';

@Component({
  selector: 'app-label-field',
  templateUrl: './label-field.component.html',
  styleUrls: ['./label-field.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabelFieldComponent {
  @Input()
  set selection(value: LabelValue[]) {
    this._selection = value || [];
    this.checkboxSelection = this._selection.map((labelValue) => `${labelValue.labelset}${labelValue.label}`);
  }
  get selection() {
    return this._selection;
  }
  private _selection: LabelValue[] = [];

  @Input() kind: LabelSetKind = LabelSetKind.RESOURCES;

  @Output() selectionChange = new EventEmitter<LabelValue[]>();

  @ViewChild('level2', { read: ElementRef }) level2Element?: ElementRef;
  @ViewChild('level2') level2Popup?: PopupComponent;

  labelSets$ = this.labelsService.getLabelsByKind(this.kind).pipe(tap((labels) => (this._labelSets = labels)));
  hasLabels = this.labelSets$.pipe(map((labels) => labels && Object.keys(labels).length > 0));
  open: boolean = false;

  private _labelSets: LabelSets | null = {};
  labelSetExpanded = '';
  labelValues: LabelValue[] = [];

  checkboxSelection: string[] = [];

  constructor(private labelsService: LabelsService) {}

  onLevel1Selection(labelSetType: string, labelSet: LabelSet) {
    this.labelSetExpanded = labelSetType;
    this.level2Popup?.close();
    this.labelValues = labelSet.labels.map((label) => ({ labelset: labelSetType, label: label.title }));
  }

  closeDropdowns() {
    this.open = false;
    this.level2Popup?.close();
    this.labelSetExpanded = '';
  }

  toggleLabel(labelValue: LabelValue) {
    const checkboxValue = `${labelValue.labelset}${labelValue.label}`;
    let newSelectedLabels;

    if (!this.checkboxSelection.includes(checkboxValue)) {
      const isMultiple = this._labelSets?.[labelValue.labelset]?.multiple;
      newSelectedLabels = isMultiple
        ? this.selection.concat([labelValue])
        : this.selection.filter((item) => item.labelset !== labelValue.labelset).concat([labelValue]);
    } else {
      newSelectedLabels = this.selection.filter(
        (item) => !(item.label === labelValue.label && item.labelset === labelValue.labelset),
      );
    }
    this.selectionChange.emit(newSelectedLabels);
  }
}
