import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  EventEmitter,
  inject,
  input,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FeaturesService } from '@flaps/core';
import { OptionModel, PaSliderModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { GenerativeProviders, INITIAL_CITATION_THRESHOLD, Widget } from '@nuclia/core';
import { BadgeComponent, ExpandableTextareaComponent, InfoCardComponent } from '@nuclia/sistema';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { JsonValidator } from '../../../validators';

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
    ExpandableTextareaComponent,
  ],
  templateUrl: './results-display-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResultsDisplayFormComponent implements OnInit, OnDestroy {
  private unsubscribeAll = new Subject<void>();
  private featuresService = inject(FeaturesService);
  private translate = inject(TranslateService);

  @Input() set config(value: Widget.ResultDisplayConfig | undefined) {
    if (value) {
      const { metadatas, ...rest } = value;
      const formattedMetadata = (metadatas || []).join('\n');
      this.form.patchValue({ ...rest, metadatas: formattedMetadata });
    }
  }
  @Input() modelNames: { [key: string]: string } = {};
  @Input() set generateAnswer(value: boolean) {
    this._generateAnswer = value;
    this.disableCitations(this.jsonOutputEnabled, value);
  }
  get generateAnswer() {
    return this._generateAnswer;
  }
  private _generateAnswer = true;
  @Input() useSearchResults = true;

  generativeModel = input<string | undefined>(undefined);
  generativeProviders = input<GenerativeProviders>({});
  modelsWithJSONOutput = computed(() =>
    Object.values(this.generativeProviders()).reduce(
      (acc, provider) =>
        acc.concat(
          Object.entries(provider.models)
            .filter(([, model]) => !!model.features.structured_output)
            .map(([key]) => key),
        ),
      [] as string[],
    ),
  );

  @Output() heightChanged = new EventEmitter<void>();
  @Output() configChanged = new EventEmitter<Widget.ResultDisplayConfig>();

  readonly metadataExamples: OptionModel[] = [
    new OptionModel({
      id: 'date',
      value: 'origin:created:date',
      label: this.translate.instant('search.configuration.result-display.display-metadata.example.origin-created-date'),
    }),
    new OptionModel({
      id: 'collaborators',
      value: 'origin:collaborators:list',
      label: this.translate.instant(
        'search.configuration.result-display.display-metadata.example.origin-collaborators-list',
      ),
    }),
    new OptionModel({
      id: 'tags',
      value: 'origin:tags:list',
      label: this.translate.instant('search.configuration.result-display.display-metadata.example.origin-tags-list'),
    }),
    new OptionModel({
      id: 'size',
      value: 'field:file.size',
      label: this.translate.instant('search.configuration.result-display.display-metadata.example.field-file-size'),
    }),
    new OptionModel({
      id: 'custom-size',
      value: 'field:file.size:string:Custom size title',
      label: this.translate.instant(
        'search.configuration.result-display.display-metadata.example.field-custom-file-size',
      ),
    }),
  ];
  metadataExampleControl = new FormControl('');
  form = new FormGroup({
    displayResults: new FormControl<boolean>(false, { nonNullable: true }),
    showResultType: new FormControl<'citations' | 'all-resources' | 'llmCitations'>('all-resources', {
      nonNullable: true,
    }),
    displayMetadata: new FormControl<boolean>(false, { nonNullable: true }),
    metadatas: new FormControl<string>('', { nonNullable: true }),
    displayThumbnails: new FormControl<boolean>(false, { nonNullable: true }),
    noScroll: new FormControl<boolean>(false, { nonNullable: true }),
    showAttachedImages: new FormControl<boolean>(false, { nonNullable: true }),
    displayFieldList: new FormControl<boolean>(false, { nonNullable: true }),
    relations: new FormControl<boolean>(false, { nonNullable: true }),
    relationGraph: new FormControl<boolean>(false, { nonNullable: true }),
    jsonOutput: new FormControl<boolean>(false, { nonNullable: true }),
    jsonSchema: new FormControl<string>('', { nonNullable: true, validators: [JsonValidator()] }),
    customizeThreshold: new FormControl<boolean>(false, { nonNullable: true }),
    citationThreshold: new FormControl<number>(INITIAL_CITATION_THRESHOLD, { nonNullable: true }),
    hideAnswer: new FormControl<boolean>(false, { nonNullable: true }),
    sortResults: new FormControl<boolean>(false, { nonNullable: true }),
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
  get metadataControl() {
    return this.form.controls.metadatas;
  }
  get jsonOutputEnabled() {
    return this.jsonOutputControl.value;
  }
  get citationsEnabled() {
    return this.showResultTypeControl.value === 'citations';
  }
  get metadataEnabled() {
    return this.form.controls.displayMetadata.value;
  }
  get customizeThresholdEnabled() {
    return this.form.controls.customizeThreshold.value;
  }

  constructor() {
    effect(() => {
      if (this.generativeModel()) {
        const structredOutput = this.modelsWithJSONOutput().includes(this.generativeModel() || '');
        if (structredOutput) {
          this.jsonOutputControl.enable();
          this.isJsonOutputDisabled = false;
        } else {
          this.jsonOutputControl.patchValue(false);
          this.jsonOutputControl.disable();
          this.isJsonOutputDisabled = true;
        }
      }
    });
  }

  ngOnInit() {
    this.form.valueChanges.pipe(takeUntil(this.unsubscribeAll)).subscribe(() => {
      const { metadatas, ...rest } = this.form.getRawValue();

      const metadataList = metadatas
        .split('\n')
        .map((metadata) => metadata.trim())
        .filter((metadata) => !!metadata);
      this.configChanged.emit({ ...rest, metadatas: metadataList });
    });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  /**
   * Citations are incompatible with json output
   */
  disableCitations(jsonOutputEnabled: boolean, generateAnswer: boolean) {
    if (jsonOutputEnabled || !generateAnswer) {
      this.showResultTypeControl.patchValue('all-resources');
      this.showResultTypeControl.disable();
    } else if (this.showResultTypeControl.disabled) {
      this.showResultTypeControl.enable();
    }
  }

  addMetadataExample(expression: string) {
    if (expression) {
      this.metadataExampleControl.patchValue('');
      const currentValue = this.metadataControl.getRawValue();
      if (!currentValue.includes(expression)) {
        this.metadataControl.patchValue(`${currentValue}\n${expression}`.trim());
      }
    }
  }
}
