import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Classification, LabelSetKind, LabelSets } from '@nuclia/core';
import { BehaviorSubject, combineLatest, map, of, switchMap, tap } from 'rxjs';
import { LabelsService } from '../labels.service';
import { Size } from '@guillotinaweb/pastanaga-angular';

@Component({
  selector: 'app-label-field',
  templateUrl: './label-field.component.html',
  styleUrls: ['./label-field.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabelFieldComponent {
  @Input()
  set selection(value: Classification[]) {
    this._selection = value || [];
  }
  get selection() {
    return this._selection;
  }
  private _selection: Classification[] = [];

  private _kind = new BehaviorSubject<LabelSetKind | undefined>(undefined);
  @Input() set kind(kind: LabelSetKind) {
    this._kind.next(kind);
  }

  private _labelSets = new BehaviorSubject<LabelSets | undefined>(undefined);
  @Input() set labelSets(value: LabelSets) {
    this._labelSets.next(value);
  }
  @Input() size: Size = 'medium';
  @Input() disabled: boolean = false;

  @Output() selectionChange = new EventEmitter<Classification[]>();
  @Output() hasLabels = new EventEmitter<boolean>();

  labelSets$ = combineLatest([this._kind, this._labelSets]).pipe(
    switchMap(([kind, labelSets]) => {
      if (kind && labelSets) {
        console.warn(`Incompatible parameters: labelSets and kind cannot be used at the same time`);
        return of(null);
      } else if (labelSets) {
        return of(labelSets);
      } else if (kind) {
        return kind === LabelSetKind.RESOURCES
          ? this.labelsService.resourceLabelSets
          : this.labelsService.textBlockLabelSets;
      } else {
        return this.labelsService.resourceLabelSets;
      }
    }),
  );

  hasLabels$ = this.labelSets$.pipe(
    map((labels) => !!labels && Object.keys(labels).length > 0),
    tap((hasLabel) => this.hasLabels.emit(hasLabel)),
  );

  constructor(private labelsService: LabelsService) {}

  updateSelection($event: Classification[]) {
    this.selection = [...$event];
    this.selectionChange.emit(this.selection);
  }
}
