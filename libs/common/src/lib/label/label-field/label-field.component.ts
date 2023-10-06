import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Classification, LabelSetKind, LabelSets } from '@nuclia/core';
import { BehaviorSubject, map, merge, ReplaySubject, tap } from 'rxjs';
import { LabelsService } from '../labels.service';
import { Size } from '@guillotinaweb/pastanaga-angular';
import { switchMap } from 'rxjs/operators';

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

  private _kind = new BehaviorSubject<LabelSetKind>(LabelSetKind.RESOURCES);
  @Input() set kind(kind: LabelSetKind) {
    this._kind.next(kind);
  }
  private _labelSets = new ReplaySubject<LabelSets>();
  @Input() set labelSets(value: LabelSets | undefined) {
    if (value) {
      this._labelSets.next(value);
    }
  }
  @Input() size: Size | undefined;
  @Input() disabled: boolean = false;

  @Output() selectionChange = new EventEmitter<Classification[]>();
  @Output() hasLabels = new EventEmitter<boolean>();

  labelSets$ = merge(
    this._labelSets,
    this._kind.pipe(
      switchMap((kind) =>
        kind === LabelSetKind.RESOURCES ? this.labelsService.resourceLabelSets : this.labelsService.paragraphLabelSets,
      ),
    ),
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
