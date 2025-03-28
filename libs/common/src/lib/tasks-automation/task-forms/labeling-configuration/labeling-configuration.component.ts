import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { InfoCardComponent, SisModalService, TwoColumnsConfigurationItemComponent } from '@nuclia/sistema';
import { LabelModule, LabelSetFormModalComponent, LabelsService } from '@flaps/core';
import { TranslateModule } from '@ngx-translate/core';
import {
  ModalConfig,
  PaButtonModule,
  PaTextFieldModule,
  PaTogglesModule,
  PaDropdownModule,
  PaPopupModule,
  PaIconModule,
  OptionModel,
} from '@guillotinaweb/pastanaga-angular';
import { LabelOperation, LabelSet, LabelSetKind, LabelSets, TaskApplyTo } from '@nuclia/core';
import { combineLatest, filter, forkJoin, map, Observable, Subject } from 'rxjs';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { shareReplay, startWith, switchMap, take, takeUntil } from 'rxjs/operators';
import { DataAugmentationTaskOnGoing } from '../../tasks-automation.models';

export interface LabelingConfiguration {
  label: LabelOperation;
  valid: boolean;
  on: TaskApplyTo;
}

@Component({
  selector: 'stf-labeling-configuration',
  imports: [
    CommonModule,
    InfoCardComponent,
    LabelModule,
    PaButtonModule,
    PaTogglesModule,
    PaTextFieldModule,
    PaDropdownModule,
    PaPopupModule,
    PaIconModule,
    ReactiveFormsModule,
    TranslateModule,
    TwoColumnsConfigurationItemComponent,
  ],
  templateUrl: './labeling-configuration.component.html',
  styleUrl: './labeling-configuration.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabelingConfigurationComponent implements OnInit, OnDestroy {
  private cdr = inject(ChangeDetectorRef);

  private labelService = inject(LabelsService);
  private modalService = inject(SisModalService);

  private unsubscribeAll = new Subject<void>();
  private _type: 'resources' | 'text-blocks' = 'resources';
  get type() {
    return this._type;
  }

  @Input() set task(value: DataAugmentationTaskOnGoing | undefined | null) {
    if (value) {
      this._task = value;
      this.initForm(value);
    }
  }
  get task() {
    return this._task;
  }
  private _task?: DataAugmentationTaskOnGoing;

  @Output() configurationChange = new EventEmitter<LabelingConfiguration>();

  labelSets: LabelSets | null = null;
  labelSetOptions: OptionModel[] = [];
  hasLabelSet = false;

  labelingForm = new FormGroup({
    on: new FormControl('resources', { nonNullable: true }),
    ident: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true }),
    labels: new FormArray([
      new FormGroup({
        label: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        description: new FormControl('', { nonNullable: true }),
        examples: new FormArray<FormControl<string>>([]),
      }),
    ]),
  });

  get labelsControls() {
    return this.labelingForm.controls.labels.controls;
  }

  get selectedLabelset() {
    return this.labelingForm.value.ident;
  }

  labelOptions = combineLatest([
    this.labelService.labelSets,
    this.labelingForm.controls.ident.valueChanges.pipe(startWith(this.selectedLabelset)),
  ]).pipe(
    map(([labelSets, selectedLabelset]) =>
      (labelSets?.[selectedLabelset || '']?.labels || []).map(
        (label) => new OptionModel({ id: label.title, value: label.title, label: label.title }),
      ),
    ),
    shareReplay(1),
  );

  ngOnInit() {
    this.labelingForm.valueChanges.pipe(takeUntil(this.unsubscribeAll)).subscribe(() => {
      this.configurationChange.emit({
        label: this.labelingForm.getRawValue(),
        valid: this.labelingForm.valid,
        on: this.type === 'resources' ? TaskApplyTo.FULL_FIELD : TaskApplyTo.TEXT_BLOCKS,
      });
    });
    this.updateLabelsets();
  }

  initForm(task: DataAugmentationTaskOnGoing) {
    const labelOperation = task.parameters?.operations?.find((operation) => operation.label)?.label;
    if (labelOperation) {
      this.labelingForm.controls.labels.clear();
      labelOperation.labels?.forEach(() => {
        this.addLabel();
      });
      this.labelingForm.patchValue({
        ...labelOperation,
        on: task.parameters.on === TaskApplyTo.FULL_FIELD ? 'resources' : 'text-blocks',
      });
    }
    this.cdr.markForCheck();
  }

  addLabel() {
    this.labelingForm.controls.labels.push(
      new FormGroup({
        label: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        description: new FormControl('', { nonNullable: true }),
        examples: new FormArray<FormControl<string>>([]),
      }),
    );
  }

  removeLabel(index: number) {
    this.labelingForm.controls.labels.removeAt(index);
  }

  clearLabels() {
    this.labelingForm.controls.labels.clear();
    this.addLabel();
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  createLabelSet() {
    this.modalService
      .openModal(
        LabelSetFormModalComponent,
        new ModalConfig({
          data: { kind: this.type === 'resources' ? LabelSetKind.RESOURCES : LabelSetKind.PARAGRAPHS },
        }),
      )
      .onClose.pipe(
        filter((labelset) => !!labelset),
        map((data) => data as { id: string; labelSet: LabelSet }),
        switchMap((data) => this._updateLabelsets(this.type).pipe(map(() => data))),
      )
      .subscribe((data) => {
        if (
          (data.labelSet.kind[0] === LabelSetKind.RESOURCES && this.type === 'resources') ||
          (data.labelSet.kind[0] === LabelSetKind.PARAGRAPHS && this.type === 'text-blocks')
        ) {
          this.labelingForm.controls.ident.setValue(data.id);
        }
      });
  }

  private _updateLabelsets(type: 'resources' | 'text-blocks' = 'resources'): Observable<void> {
    if (type) {
      this._type = type === 'resources' ? 'resources' : 'text-blocks';
    }
    if (this._type === 'resources') {
      return forkJoin([
        this.labelService.resourceLabelSets.pipe(take(1)),
        this.labelService.hasResourceLabelSets.pipe(take(1)),
      ]).pipe(
        map(([labelSets, hasLabelSet]) => {
          this.labelSets = labelSets;
          this.hasLabelSet = hasLabelSet;
          this.labelSetOptions = labelSets ? this.getLabelsetOptions(labelSets) : [];
          return undefined;
        }),
      );
    } else {
      return forkJoin([
        this.labelService.textBlockLabelSets.pipe(take(1)),
        this.labelService.hasTextBlockLabelSets.pipe(take(1)),
      ]).pipe(
        map(([labelSets, hasLabelSet]) => {
          this.labelSets = labelSets;
          this.hasLabelSet = hasLabelSet;
          this.labelSetOptions = labelSets ? this.getLabelsetOptions(labelSets) : [];
          return undefined;
        }),
      );
    }
  }
  updateLabelsets(type: 'resources' | 'text-blocks' = 'resources') {
    this._updateLabelsets(type).subscribe(() => this.cdr.markForCheck());
  }
  getLabelsetOptions(labelSets: LabelSets) {
    return Object.entries(labelSets).map(
      ([key, labelSet]) => new OptionModel({ id: key, value: key, label: labelSet.title }),
    );
  }
}
