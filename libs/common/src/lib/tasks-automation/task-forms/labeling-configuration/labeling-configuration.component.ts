import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  inject,
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
} from '@guillotinaweb/pastanaga-angular';
import { LabelOperation, LabelSet, LabelSetKind, LabelSets, TaskApplyTo } from '@nuclia/core';
import { filter, forkJoin, map, Observable, Subject } from 'rxjs';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { switchMap, take, takeUntil } from 'rxjs/operators';

export interface LabelingConfiguration {
  label: LabelOperation;
  valid: boolean;
  on: TaskApplyTo;
}

@Component({
  selector: 'stf-labeling-configuration',
  standalone: true,
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

  @Output() configurationChange = new EventEmitter<LabelingConfiguration>();

  labelSets: LabelSets | null = null;
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
          return undefined;
        }),
      );
    }
  }
  updateLabelsets(type: 'resources' | 'text-blocks' = 'resources') {
    this._updateLabelsets(type).subscribe(() => this.cdr.markForCheck());
  }
}
