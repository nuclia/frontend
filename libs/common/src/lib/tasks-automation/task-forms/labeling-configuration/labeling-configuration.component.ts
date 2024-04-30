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
import {
  BadgeComponent,
  DropdownButtonComponent,
  InfoCardComponent,
  SisModalService,
  SisToastService,
  TwoColumnsConfigurationItemComponent,
} from '@nuclia/sistema';
import { LabelModule, LabelSetFormModalComponent, LabelsService, SDKService } from '@flaps/core';
import { TranslateModule } from '@ngx-translate/core';
import { ModalConfig, PaButtonModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { LabelSet, LabelSetKind, LabelSets, Search } from '@nuclia/core';
import { filter, map, Observable, Subject, switchMap, take } from 'rxjs';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntil } from 'rxjs/operators';

interface LabelingConfigurationBase {
  selectedLabelSet?: { id: string; labelSet: LabelSet };
  labelingBy: 'existing-labeling' | 'prompt';
  prompt: string;
}

export interface LabelingConfiguration extends LabelingConfigurationBase {
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
  private sdk = inject(SDKService);
  private labelService = inject(LabelsService);
  private modalService = inject(SisModalService);
  private toaster = inject(SisToastService);
  private cdr = inject(ChangeDetectorRef);

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

  @Output() configurationChange = new EventEmitter<LabelingConfiguration>();

  labelSets?: Observable<LabelSets | null>;
  hasLabelSet?: Observable<boolean>;
  selectedLabelSet?: { id: string; labelSet: LabelSet };
  labeledResourceCount?: number;

  labelingOptionsForm = new FormGroup({
    labelingBy: new FormControl<'existing-labeling' | 'prompt'>('existing-labeling', { nonNullable: true }),
    prompt: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
  });
  errorMessages = {
    required: 'validation.required',
  };

  get labelingByValue() {
    return this.labelingOptionsForm.controls.labelingBy.value;
  }

  private validConfiguration(config: LabelingConfigurationBase) {
    return (
      !!config.selectedLabelSet &&
      (config.labelingBy === 'existing-labeling' || (config.labelingBy === 'prompt' && !!config.prompt))
    );
  }

  ngOnInit() {
    this.labelingOptionsForm.valueChanges.pipe(takeUntil(this.unsubscribeAll)).subscribe(() => {
      const config = { ...this.labelingOptionsForm.getRawValue(), selectedLabelSet: this.selectedLabelSet };
      this.configurationChange.emit({
        ...config,
        valid: this.validConfiguration(config),
      });
    });
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
          this.triggerSelectLabelSet(data);
        }
      });
  }

  triggerSelectLabelSet(data: { id: string; labelSet: LabelSet }) {
    this.selectedLabelSet = data;
    const config = { ...this.labelingOptionsForm.getRawValue(), selectedLabelSet: data };
    this.configurationChange.emit({ ...config, valid: this.validConfiguration(config) });
    const facetId = `/classification.labels/${data.id}`;
    this.sdk.currentKb
      .pipe(
        take(1),
        switchMap((kb) =>
          this.type === 'resources'
            ? kb.catalog('', { faceted: [facetId] })
            : kb.search('', [Search.Features.PARAGRAPH], { faceted: [facetId] }),
        ),
      )
      .subscribe({
        next: (results) => {
          if (results.type === 'error') {
            this.toaster.error('tasks-automation.errors.counting-labeled-resources');
          } else {
            const facets: Search.FacetsResult =
              (this.type === 'resources' ? results.fulltext?.facets : results.paragraphs?.facets) || {};
            this.labeledResourceCount = Object.values(facets[facetId] || {}).reduce((count, value) => {
              return count + value;
            }, 0);
            this.cdr.detectChanges();
          }
        },
        error: () => {
          this.toaster.error('tasks-automation.errors.counting-labeled-resources');
        },
      });
  }
}
