import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  BadgeComponent,
  DropdownButtonComponent,
  InfoCardComponent,
  SisModalService,
  TwoColumnsConfigurationItemComponent,
} from '@nuclia/sistema';
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
} from '@guillotinaweb/pastanaga-angular';
import { LabelOperation, LabelSet, LabelSetKind, LabelSets, TaskStatus } from '@nuclia/core';
import { filter, map, Observable, Subject } from 'rxjs';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntil } from 'rxjs/operators';

export interface LabelingConfiguration {
  label: LabelOperation;
  valid: boolean;
}

@Component({
  selector: 'stf-labeling-configuration',
  standalone: true,
  imports: [
    CommonModule,
    DropdownButtonComponent,
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
    BadgeComponent,
  ],
  templateUrl: './labeling-configuration.component.html',
  styleUrl: './labeling-configuration.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabelingConfigurationComponent implements OnInit, OnDestroy {
  private labelService = inject(LabelsService);
  private modalService = inject(SisModalService);

  private unsubscribeAll = new Subject<void>();
  private _type: 'resources' | 'text-blocks' = 'resources';
  @Input() set type(value: 'resources' | 'text-blocks') {
    this._type = value;
    this.labelSets = value === 'resources' ? this.labelService.resourceLabelSets : this.labelService.textBlockLabelSets;
    this.hasLabelSet =
      value === 'resources' ? this.labelService.hasResourceLabelSets : this.labelService.hasTextBlockLabelSets;
  }
  get type() {
    return this._type;
  }
  private _task?: TaskStatus;
  @Input() set task(value: TaskStatus | undefined) {
    if (value) {
      this._task = value;
      this.initForm(value);
    }
  }
  get task() {
    return this._task;
  }

  @Output() configurationChange = new EventEmitter<LabelingConfiguration>();

  labelSets?: Observable<LabelSets | null>;
  hasLabelSet?: Observable<boolean>;

  labelingForm = new FormGroup({
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

  ngOnInit() {
    this.labelingForm.valueChanges.pipe(takeUntil(this.unsubscribeAll)).subscribe(() => {
      this.configurationChange.emit({
        label: this.labelingForm.getRawValue(),
        valid: this.labelingForm.valid,
      });
    });
  }

  initForm(task: TaskStatus) {
    const labelOperation = task.parameters.operations?.find((operation) => !!operation.label)?.label;
    if (labelOperation) {
      this.labelingForm.controls.labels.clear();
      labelOperation.labels.forEach(() => this.addLabel());
      this.labelingForm.patchValue(labelOperation);
      this.labelingForm.disable();
    }
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
}
