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
import { Classification, LabelOperation, LabelSet, LabelSetKind, LabelSets, TaskApplyTo } from '@nuclia/core';
import { BehaviorSubject, combineLatest, filter, forkJoin, map, Observable, Subject } from 'rxjs';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { shareReplay, startWith, switchMap, take, takeUntil } from 'rxjs/operators';
import { DataAugmentationTaskOnGoing } from '../../tasks-automation.models';

export interface LabelingConfiguration {
  operations: LabelOperation[];
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

  labelSets = new BehaviorSubject<LabelSets | null>(null);
  hasLabelSet = new BehaviorSubject<boolean>(false);

  labelingForm = new FormGroup({
    on: new FormControl('resources', { nonNullable: true }),
    operations: new FormArray<
      FormGroup<{
        ident: FormControl<string>;
        description: FormControl<string>;
        multiple: FormControl<boolean>;
        labels: FormArray<
          FormGroup<{
            label: FormControl<string>;
            description: FormControl<string>;
            examples: FormArray<FormControl<string>>;
          }>
        >;
      }>
    >([]),
  });

  get operationControls() {
    return this.labelingForm.controls.operations.controls;
  }

  selectedLabels = this.labelingForm.valueChanges.pipe(
    startWith(this.labelingForm.value),
    map((value) =>
      (value.operations || []).reduce((acc, curr) => {
        const ident = curr.ident;
        return acc.concat((curr.labels || []).map((label) => ({ labelset: ident || '', label: label.label || '' })));
      }, [] as Classification[]),
    ),
  );

  labelOptions = combineLatest([this.labelService.labelSets, this.selectedLabels]).pipe(
    map(([labelsets, selectedLabels]) =>
      Object.fromEntries(
        Object.entries(labelsets || {}).map(([key, labelset]) => [
          key,
          labelset.labels.map(
            (label) =>
              new OptionModel({
                id: label.title,
                value: label.title,
                label: label.title,
                filtered: selectedLabels.some((item) => item.labelset === key && item.label === label.title),
              }),
          ),
        ]),
      ),
    ),
    shareReplay(1),
  );

  selectedLabelSets = this.labelingForm.valueChanges.pipe(
    startWith(this.labelingForm.value),
    map((value) => (value.operations || []).map((operation) => operation.ident || '')),
  );

  labelSetOptions = combineLatest([this.labelSets, this.selectedLabelSets]).pipe(
    map(([labelSets, selectedLabelSets]) =>
      Object.entries(labelSets || {}).map(
        ([key, labelSet]) =>
          new OptionModel({ id: key, value: key, label: labelSet.title, filtered: selectedLabelSets.includes(key) }),
      ),
    ),
    shareReplay(1),
  );

  constructor() {
    this.addOperation(1);
  }

  ngOnInit() {
    this.labelingForm.valueChanges.pipe(takeUntil(this.unsubscribeAll)).subscribe(() => {
      this.configurationChange.emit({
        operations: this.labelingForm.controls.operations.getRawValue(),
        valid: this.labelingForm.valid,
        on: this.type === 'resources' ? TaskApplyTo.FULL_FIELD : TaskApplyTo.TEXT_BLOCKS,
      });
    });
    this.updateLabelsets();
  }

  initForm(task: DataAugmentationTaskOnGoing) {
    this.labelingForm.controls.on.patchValue(
      task.parameters.on === TaskApplyTo.FULL_FIELD ? 'resources' : 'text-blocks',
    );
    const operations = task.parameters.operations
      ?.filter((operation) => operation.label)
      ?.map((operation) => operation.label as LabelOperation);

    if (operations && operations.length > 0) {
      this.labelingForm.controls.operations.clear();
      operations.forEach((operation, index) => {
        this.addOperation(operation.labels?.length || 0);
        this.operationControls[index].patchValue(operation);
      });
    }
    this.cdr.markForCheck();
  }

  addOperation(numLabels: number) {
    const formGroup = new FormGroup({
      ident: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      description: new FormControl('', { nonNullable: true }),
      multiple: new FormControl<boolean>(false, { nonNullable: true }),
      labels: new FormArray<
        FormGroup<{
          label: FormControl<string>;
          description: FormControl<string>;
          examples: FormArray<FormControl<string>>;
        }>
      >([]),
    });
    for (let i = 0; i < numLabels; i++) {
      formGroup.controls.labels.push(this.newLabelControl());
    }
    this.labelingForm.controls.operations.push(formGroup);
  }

  removeOperation(index: number) {
    this.labelingForm.controls.operations.removeAt(index);
  }

  newLabelControl() {
    return new FormGroup({
      label: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      description: new FormControl('', { nonNullable: true }),
      examples: new FormArray<FormControl<string>>([]),
    });
  }

  addLabel(index: number) {
    this.operationControls[index].controls.labels.push(this.newLabelControl());
  }

  removeLabel(operationIndex: number, labelIndex: number) {
    this.operationControls[operationIndex].controls.labels.removeAt(labelIndex);
  }

  clearLabels(index: number) {
    this.labelSets.pipe(take(1)).subscribe((labelSets) => {
      const formGroup = this.operationControls[index];
      const currentLabelset = labelSets?.[formGroup.controls.ident.value];
      if (currentLabelset?.multiple) {
        formGroup.controls.multiple.enable();
        formGroup.controls.multiple.setValue(true);
      } else {
        formGroup.controls.multiple.disable();
        formGroup.controls.multiple.setValue(false);
      }
      formGroup.controls.labels.clear();
      formGroup.controls.description.setValue('');
      formGroup.controls.labels.push(this.newLabelControl());
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  createLabelSet(index: number) {
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
          this.operationControls[index].controls.ident.setValue(data.id);
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
          this.labelSets.next(labelSets);
          this.hasLabelSet.next(hasLabelSet);
          return undefined;
        }),
      );
    } else {
      return forkJoin([
        this.labelService.textBlockLabelSets.pipe(take(1)),
        this.labelService.hasTextBlockLabelSets.pipe(take(1)),
      ]).pipe(
        map(([labelSets, hasLabelSet]) => {
          this.labelSets.next(labelSets);
          this.hasLabelSet.next(hasLabelSet);
          return undefined;
        }),
      );
    }
  }
  updateLabelsets(type: 'resources' | 'text-blocks' = 'resources') {
    this._updateLabelsets(type).subscribe(() => this.cdr.markForCheck());
  }
}
