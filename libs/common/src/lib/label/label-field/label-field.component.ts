import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Classification, LabelSetKind, LabelSets } from '@nuclia/core';
import { BehaviorSubject, map, ReplaySubject, Subject, takeUntil, tap } from 'rxjs';
import { LabelsService } from '../labels.service';
import { Size } from '@guillotinaweb/pastanaga-angular';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-label-field',
  templateUrl: './label-field.component.html',
  styleUrls: ['./label-field.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabelFieldComponent implements OnDestroy, OnInit {
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

  private _labelSets = new BehaviorSubject<LabelSets | undefined>(undefined);
  @Input() set labelSets(value: LabelSets | undefined) {
    if (value) {
      this.labelSets$.next(value);
    }
  }
  @Input() size: Size | undefined;
  @Input() disabled: boolean = false;

  @Output() selectionChange = new EventEmitter<Classification[]>();
  @Output() hasLabels = new EventEmitter<boolean>();

  labelSets$ = new ReplaySubject<LabelSets>();
  hasLabels$ = this.labelSets$.pipe(
    map((labels) => !!labels && Object.keys(labels).length > 0),
    tap((hasLabel) => this.hasLabels.emit(hasLabel)),
  );
  unsubscribeAll = new Subject<void>();

  constructor(private labelsService: LabelsService) {}

  ngOnInit() {
    if (this._labelSets.getValue()) {
      this._labelSets
        .pipe(
          map((labelsets) => labelsets as LabelSets),
          takeUntil(this.unsubscribeAll),
        )
        .subscribe(this.labelSets$);
    } else {
      this._kind
        .pipe(
          switchMap((kind) =>
            kind === LabelSetKind.RESOURCES
              ? this.labelsService.resourceLabelSets
              : this.labelsService.paragraphLabelSets,
          ),
          map((labelsets) => labelsets || {}),
          takeUntil(this.unsubscribeAll),
        )
        .subscribe(this.labelSets$);
    }
  }

  updateSelection($event: Classification[]) {
    this.selection = [...$event];
    this.selectionChange.emit(this.selection);
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}
