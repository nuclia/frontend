import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Classification, LabelSetKind } from '@nuclia/core';
import { BehaviorSubject, map, switchMap, tap } from 'rxjs';
import { LabelsService } from '../../../../../../apps/dashboard/src/app/services/labels.service';
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

  @Input() set kind(kind: LabelSetKind) {
    this.labelKind.next(kind);
  }
  @Input() size: Size | undefined;

  @Output() selectionChange = new EventEmitter<Classification[]>();
  @Output() noLabels = new EventEmitter<boolean>();

  private labelKind = new BehaviorSubject<LabelSetKind>(LabelSetKind.RESOURCES);
  labelSets$ = this.labelKind.pipe(switchMap((kind) => this.labelsService.getLabelsByKind(kind)));
  hasLabels = this.labelSets$.pipe(
    map((labels) => labels && Object.keys(labels).length > 0),
    tap((hasLabel) => this.noLabels.emit(!hasLabel)),
  );

  constructor(private labelsService: LabelsService) {}

  updateSelection($event: Classification[]) {
    this.selection = [...$event];
    this.selectionChange.emit(this.selection);
  }
}
