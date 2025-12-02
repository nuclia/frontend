import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  AccordionBodyDirective,
  AccordionComponent,
  AccordionItemComponent,
  OptionModel,
  PaButtonModule,
  PaSliderModule,
  PaTextFieldModule,
  PaTogglesModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import {
  INITIAL_CITATION_THRESHOLD,
  KnowledgeBox,
  LearningConfigurationOption,
  NucliaDBDriver,
  RAG_METADATAS,
  Widget,
} from '@nuclia/core';
import { BadgeComponent, ExpandableTextareaComponent, InfoCardComponent } from '@nuclia/sistema';
import { JsonValidator } from 'libs/common/src/lib/validators';
import { WorkflowService } from '../../workflow.service';
import { CommonModule } from '@angular/common';
import { catchError, filter, forkJoin, map, of, shareReplay, Subject, switchMap, take, takeUntil, tap } from 'rxjs';
import { FeaturesService, SDKService } from '@flaps/core';

@Component({
  selector: 'app-ask-configuration',
  imports: [
    AccordionBodyDirective,
    AccordionComponent,
    AccordionItemComponent,
    BadgeComponent,
    CommonModule,
    ExpandableTextareaComponent,
    InfoCardComponent,
    PaButtonModule,
    PaSliderModule,
    PaTextFieldModule,
    PaTogglesModule,
    ReactiveFormsModule,
    TranslateModule,
  ],
  templateUrl: './ask-configuration.component.html',
  styleUrls: ['../../../../../search-widget/_common-form.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AskConfigurationComponent implements OnDestroy, OnInit {
  private sdk = inject(SDKService);
  private workflowService = inject(WorkflowService);
  private features = inject(FeaturesService);

  @Input() set config(value: Widget.SearchConfiguration | undefined) {
    if (value) {
      this.form.patchValue({
        searchBox: value.searchBox,
        generativeAnswer: value.generativeAnswer,
        resultDisplay: value.resultDisplay,
      });
    }
  }
  @Input() set sources(value: string[] | undefined) {
    this.updateSemanticModels.next(value || []);
  }
  _semanticModels: OptionModel[] = [];
  @Output() configChanged = new EventEmitter<any>();

  @ViewChild('searchBox', { read: AccordionItemComponent }) searchBoxItem?: AccordionItemComponent;
  @ViewChild('generativeAnswer', { read: AccordionItemComponent }) generativeAnswerItem?: AccordionItemComponent;
  @ViewChild('resultDisplay', { read: AccordionItemComponent }) resultDisplayItem?: AccordionItemComponent;

  unsubscribeAll = new Subject<void>();
  updateSemanticModels = new Subject<string[]>();
  semanticModels = this.updateSemanticModels.pipe(
    switchMap((sources) =>
      sources.length === 0
        ? of([])
        : forkJoin([
            this.sdk.currentArag.pipe(take(1)),
            this.workflowService.semanticModels$.pipe(
              filter((models) => !!models),
              take(1),
            ),
          ]).pipe(
            switchMap(([arag, semanticModels]) =>
              arag.getDrivers('nucliadb').pipe(
                map((drivers) => drivers as NucliaDBDriver[]),
                switchMap((drivers) =>
                  forkJoin(
                    drivers
                      .filter((driver) => sources.includes(driver.identifier))
                      .map((driver) =>
                        new KnowledgeBox(this.sdk.nuclia, '', {
                          id: driver.config.kbid,
                          slug: '',
                          title: '',
                          zone: this.sdk.nuclia.options.zone || '',
                        }).getConfiguration(),
                      ),
                  ).pipe(
                    catchError(() => {
                      // It will fail if any driver points to an external kb not owned by the user
                      return of([]);
                    }),
                  ),
                ),
                map((kbConfigs) => this.getAvailableSemanticModels(kbConfigs, semanticModels)),
                tap((models) => {
                  const vectorset = this.searchBoxForm.controls.vectorset;
                  if (vectorset && !models.find((model) => model.value === vectorset.value)) {
                    vectorset.patchValue('');
                  }
                }),
              ),
            ),
          ),
    ),
    shareReplay(1),
  );
  isRagImagesEnabled = this.features.authorized.ragImages;
  metadataIds = Object.values(RAG_METADATAS);
  isGraphSearchEnabled = this.features.authorized.graphSearch;

  form = new FormGroup({
    searchBox: new FormGroup({
      setPreselectedFilters: new FormControl<boolean>(false, { nonNullable: true }),
      preselectedFilterExpression: new FormControl<string>('', { nonNullable: true, updateOn: 'blur' }),
      rephraseQuery: new FormControl<boolean>(false, { nonNullable: true }),
      useRephrasePrompt: new FormControl<boolean>(false, { nonNullable: true }),
      rephrasePrompt: new FormControl<string>('', { nonNullable: true }),
      generateAnswerWith: new FormControl<'only-semantic' | 'semantic-and-full-text'>('semantic-and-full-text', {
        nonNullable: true,
      }),
      showHiddenResources: new FormControl<boolean>(false, { nonNullable: true }),
      semanticReranking: new FormControl<boolean>(true, { nonNullable: true }),
      rrfBoosting: new FormControl<boolean>(false, { nonNullable: true }),
      rrfSemanticBoosting: new FormControl<number>(1, { nonNullable: true }),
      vectorset: new FormControl<string>('', { nonNullable: true }),
      limitParagraphs: new FormControl<boolean>(false, { nonNullable: true }),
      paragraphsLimit: new FormControl<number | null>(null),
      useSecurityGroups: new FormControl<boolean>(false, { nonNullable: true }),
      securityGroups: new FormControl<string>('', { nonNullable: true }),
    }),
    generativeAnswer: new FormGroup({
      generateAnswer: new FormControl<boolean>(true, { nonNullable: true }),
      usePrompt: new FormControl<boolean>(false, { nonNullable: true }),
      prompt: new FormControl<string>('', { nonNullable: true, updateOn: 'blur' }),
      useSystemPrompt: new FormControl<boolean>(false, { nonNullable: true }),
      systemPrompt: new FormControl<string>('', { nonNullable: true, updateOn: 'blur' }),
      limitTokenConsumption: new FormControl<boolean>(false, { nonNullable: true }),
      tokenConsumptionLimit: new FormControl<number | null>(null),
      outputTokenConsumptionLimit: new FormControl<number | null>(null),
      ragStrategies: new FormGroup({
        includeTextualHierarchy: new FormControl<boolean>(false, { nonNullable: true }),
        includeNeighbouringParagraphs: new FormControl<boolean>(false, { nonNullable: true }),
        precedingParagraphs: new FormControl<number | null>(null),
        succeedingParagraphs: new FormControl<number | null>(null),
        entireResourceAsContext: new FormControl<boolean>(false, { nonNullable: true }),
        metadatasRagStrategy: new FormControl<boolean>(false, { nonNullable: true }),
        metadatas: new FormGroup(
          Object.values(RAG_METADATAS).reduce(
            (controls, metadata) => {
              controls[metadata] = new FormControl<boolean>(false, { nonNullable: true });
              return controls;
            },
            {} as Record<RAG_METADATAS, FormControl<boolean>>,
          ),
        ),
        graphRagStrategy: new FormControl<boolean>(false, { nonNullable: true }),
        graph: new FormGroup({
          hops: new FormControl<number | null>(3),
          top_k: new FormControl<number | null>(50),
          exclude_processor_relations: new FormControl<boolean>(false, { nonNullable: true }),
          relation_text_as_paragraphs: new FormControl<boolean>(false, { nonNullable: true }),
          generative_relation_ranking: new FormControl<boolean>(false, { nonNullable: true }),
          suggest_query_entity_detection: new FormControl<boolean>(false, { nonNullable: true }),
        }),
        conversationalRagStrategy: new FormControl<boolean>(false, { nonNullable: true }),
        conversationOptions: new FormGroup({
          attachmentsText: new FormControl<boolean>(false, { nonNullable: true }),
          attachmentsImages: new FormControl<boolean>(false, { nonNullable: true }),
          full: new FormControl<boolean>(false, { nonNullable: true }),
        }),
        maxMessages: new FormControl<number | null>(null),
        maxNumberOfResources: new FormControl<number | null>(null),
        includeRemaining: new FormControl<boolean>(false, { nonNullable: true }),
        excludeFilter: new FormControl<string>('', { nonNullable: true, updateOn: 'blur' }),
        fieldsAsContext: new FormControl<boolean>(false, { nonNullable: true }),
        fieldIds: new FormControl<string>('', { nonNullable: true, updateOn: 'blur' }),
        dataAugmentationFieldPrefixes: new FormControl<string>('', { nonNullable: true, updateOn: 'blur' }),
        includePageImages: new FormControl<boolean>(false, { nonNullable: true }),
        maxNumberOfImages: new FormControl<number | null>(null),
        includeParagraphImages: new FormControl<boolean>(false, { nonNullable: true }),
      }),
    }),
    resultDisplay: new FormGroup({
      showResultType: new FormControl<'citations' | 'all-resources' | 'llmCitations'>('all-resources', {
        nonNullable: true,
      }),
      jsonOutput: new FormControl<boolean>(false, { nonNullable: true }),
      jsonSchema: new FormControl<string>('', { nonNullable: true, validators: [JsonValidator()] }),
      customizeThreshold: new FormControl<boolean>(false, { nonNullable: true }),
      citationThreshold: new FormControl<number>(INITIAL_CITATION_THRESHOLD, { nonNullable: true }),
    }),
  });

  get searchBoxForm() {
    return this.form.controls.searchBox;
  }
  get preselectedFiltersEnabled() {
    return this.searchBoxForm.controls.setPreselectedFilters.value;
  }
  get preselectedFilterExpressionControl() {
    return this.searchBoxForm.controls.preselectedFilterExpression;
  }
  get rephraseQueryEnabled() {
    return this.searchBoxForm.controls.rephraseQuery.value;
  }
  get useRephrasePromptEnabled() {
    return this.searchBoxForm.controls.useRephrasePrompt.value;
  }
  get limitParagraphsEnabled() {
    return this.searchBoxForm.controls.limitParagraphs.value;
  }
  get rrfBoostingEnabled() {
    return this.searchBoxForm.controls.rrfBoosting.value;
  }
  get securityGroupsEnabled() {
    return this.searchBoxForm.controls.useSecurityGroups.value;
  }

  get generativeAnswerForm() {
    return this.form.controls.generativeAnswer;
  }
  get generateAnswerEnabled() {
    return this.generativeAnswerForm.controls.generateAnswer.value;
  }
  get usePromptEnabled() {
    return this.generativeAnswerForm.controls.usePrompt.value;
  }
  get useSystemPromptEnabled() {
    return this.generativeAnswerForm.controls.useSystemPrompt.value;
  }
  get limitTokenConsumptionEnabled() {
    return this.generativeAnswerForm.controls.limitTokenConsumption.value;
  }
  get entireResourceAsContextEnabled() {
    return this.generativeAnswerForm.controls.ragStrategies.controls.entireResourceAsContext.value;
  }
  get metadatasEnabled() {
    return this.generativeAnswerForm.controls.ragStrategies.controls.metadatasRagStrategy.value;
  }
  get graphEnabled() {
    return this.generativeAnswerForm.controls.ragStrategies.controls.graphRagStrategy.value;
  }
  get conversationalStrategyEnabled() {
    return this.generativeAnswerForm.controls.ragStrategies.controls.conversationalRagStrategy.value;
  }
  get attachmentsImagesEnabled() {
    return this.generativeAnswerForm.controls.ragStrategies.controls.conversationOptions.controls.attachmentsImages
      .value;
  }
  get fullMessagesEnabled() {
    return this.generativeAnswerForm.controls.ragStrategies.controls.conversationOptions.controls.full.value;
  }
  get fieldsAsContextEnabled() {
    return this.generativeAnswerForm.controls.ragStrategies.controls.fieldsAsContext.value;
  }
  get includeNeighbouringParagraphsEnabled() {
    return this.generativeAnswerForm.controls.ragStrategies.controls.includeNeighbouringParagraphs.value;
  }
  get includePageImagesEnabled() {
    return this.generativeAnswerForm.controls.ragStrategies.controls.includePageImages.value;
  }
  get includePageImagesControl() {
    return this.generativeAnswerForm.controls.ragStrategies.controls.includePageImages;
  }
  get includeParagraphImagesControl() {
    return this.generativeAnswerForm.controls.ragStrategies.controls.includeParagraphImages;
  }

  get resultDisplayForm() {
    return this.form.controls.resultDisplay;
  }
  get showResultTypeControl() {
    return this.resultDisplayForm.controls.showResultType;
  }
  get jsonOutputControl() {
    return this.resultDisplayForm.controls.jsonOutput;
  }
  get jsonOutputEnabled() {
    return this.jsonOutputControl.value;
  }
  get citationsEnabled() {
    return this.showResultTypeControl.value === 'citations';
  }
  get customizeThresholdEnabled() {
    return this.resultDisplayForm.controls.customizeThreshold.value;
  }

  ngOnInit() {
    this.form.valueChanges.pipe(takeUntil(this.unsubscribeAll)).subscribe(() => {
      this.configChanged.emit(this.form.getRawValue());
    });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  updateHeight() {
    this.searchBoxItem?.updateContentHeight();
    this.generativeAnswerItem?.updateContentHeight();
    this.resultDisplayItem?.updateContentHeight();
  }

  disableCitations(jsonOutputEnabled: boolean, generateAnswer: boolean) {
    // Citations are incompatible with json output
    if (jsonOutputEnabled || !generateAnswer) {
      this.showResultTypeControl.patchValue('all-resources');
      this.showResultTypeControl.disable();
    } else if (this.showResultTypeControl.disabled) {
      this.showResultTypeControl.enable();
    }
  }

  getAvailableSemanticModels(kbConfigs: { [id: string]: any }[], models: LearningConfigurationOption[]) {
    const counters = kbConfigs.reduce(
      (acc, curr) => {
        (curr['semantic_models'] || []).forEach((modelId: string) => {
          acc[modelId] = acc[modelId] ? acc[modelId] + 1 : 1;
        });
        return acc;
      },
      {} as { [model: string]: number },
    );
    // Get only semantic models that exist in all selected kbs
    const modelIds = Object.entries(counters)
      .filter(([, value]) => value === kbConfigs.length)
      .map(([key]) => key);
    return models
      .filter((model) => modelIds.includes(model.value))
      .map((model) => new OptionModel({ id: model.value, value: model.value, label: model.name, help: model.value }));
  }
}
