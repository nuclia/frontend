import {
  booleanAttribute,
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
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { PaSliderModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { INITIAL_CITATION_THRESHOLD, ResultDisplayConfig } from '../../search-widget.models';
import { Subject } from 'rxjs';
import { FeaturesService } from '@flaps/core';
import { takeUntil } from 'rxjs/operators';
import { BadgeComponent, InfoCardComponent } from '@nuclia/sistema';
import { JsonValidator } from '../../../validators';

// TODO remove when all LLMs support JSON output
const LLM_WITH_JSON_OUTPUT_SUPPORT: string[] = [
  'chatgpt-azure',
  'chatgpt-azure-4-turbo',
  'chatgpt-azure-4o',
  'claude-3',
  'claude-3-fast',
  'claude-3-5-fast',
  'chatgpt-vision',
  'chatgpt4',
  'chatgpt4o',
  'chatgpt4o-mini',
  'gemini-1-5-pro',
  'azure-mistral',
];

@Component({
  selector: 'stf-results-display-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    PaTogglesModule,
    PaTextFieldModule,
    InfoCardComponent,
    BadgeComponent,
    PaSliderModule,
  ],
  templateUrl: './results-display-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResultsDisplayFormComponent implements OnInit, OnDestroy {
  private unsubscribeAll = new Subject<void>();
  private featuresService = inject(FeaturesService);

  @Input() set config(value: ResultDisplayConfig | undefined) {
    if (value) {
      this.form.patchValue(value);
    }
  }
  @Input() set useSynonymsEnabled(value: boolean) {
    if (value) {
      this.form.controls.relations.disable();
    } else {
      this.form.controls.relations.enable();
    }
  }
  // TODO remove when all LLMs support JSON output
  @Input() modelNames: { [key: string]: string } = {};
  @Input() set generativeModel(model: string | undefined) {
    if (model) {
      this._generativeModel = model;
      if (!LLM_WITH_JSON_OUTPUT_SUPPORT.includes(model)) {
        this.jsonOutputControl.patchValue(false);
        this.jsonOutputControl.disable();
        this.isJsonOutputDisabled = true;
      } else {
        this.jsonOutputControl.enable();
        this.isJsonOutputDisabled = false;
      }
    }
  }
  get generativeModel() {
    return this._generativeModel;
  }
  private _generativeModel = '';
  @Input() useSearchResults = true;

  @Output() heightChanged = new EventEmitter<void>();
  @Output() configChanged = new EventEmitter<ResultDisplayConfig>();

  form = new FormGroup({
    displayResults: new FormControl<boolean>(false, { nonNullable: true }),
    showResultType: new FormControl<'citations' | 'all-resources'>('all-resources', { nonNullable: true }),
    displayMetadata: new FormControl<boolean>(false, { nonNullable: true }),
    displayThumbnails: new FormControl<boolean>(false, { nonNullable: true }),
    showAttachedImages: new FormControl<boolean>(false, { nonNullable: true }),
    displayFieldList: new FormControl<boolean>(false, { nonNullable: true }),
    relations: new FormControl<boolean>(false, { nonNullable: true }),
    relationGraph: new FormControl<boolean>(false, { nonNullable: true }),
    jsonOutput: new FormControl<boolean>(false, { nonNullable: true }),
    jsonSchema: new FormControl<string>('', { nonNullable: true, validators: [JsonValidator()] }),
    customizeThreshold: new FormControl<boolean>(false, { nonNullable: true }),
    citationThreshold: new FormControl<number>(INITIAL_CITATION_THRESHOLD, { nonNullable: true }),
  });

  isKnowledgeGraphEnabled = this.featuresService.unstable.knowledgeGraph;
  isJsonOutputDisabled = false;

  get displayResultsEnabled() {
    return this.form.controls.displayResults.value;
  }
  get showResultTypeControl() {
    return this.form.controls.showResultType;
  }
  get jsonOutputControl() {
    return this.form.controls.jsonOutput;
  }
  get jsonOutputEnabled() {
    return this.jsonOutputControl.value;
  }
  get citationsEnabled() {
    return this.showResultTypeControl.value === 'citations';
  }
  get customizeThresholdEnabled() {
    return this.form.controls.customizeThreshold.value;
  }

  ngOnInit() {
    this.form.valueChanges
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe(() => this.configChanged.emit({ ...this.form.getRawValue() }));
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  /**
   * Citations are incompatible with json output
   */
  disableCitations(jsonOutputEnabled: boolean) {
    if (jsonOutputEnabled) {
      this.showResultTypeControl.patchValue('all-resources');
      this.showResultTypeControl.disable();
    } else if (this.showResultTypeControl.disabled) {
      this.showResultTypeControl.enable();
    }
  }
}
