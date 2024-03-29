import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { BackendConfigurationService, FeaturesService, SDKService } from '@flaps/core';
import { combineLatest, filter, forkJoin, map, Observable, of, skip, Subject, switchMap, take } from 'rxjs';
import { TranslateService } from '@guillotinaweb/pastanaga-angular';
import { LOCAL_STORAGE } from '@ng-web-apis/common';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import {
  AdvancedForm,
  DEFAULT_CONFIGURATION,
  DEFAULT_FILTERS,
  FilterSelectionType,
  getAskPresetConfig,
  getDiscoverConfig,
  getFindPresetConfig,
  getSearchPresetConfig,
  isModifiedConfig,
  PresetAccordionType,
  PresetForm,
  PresetType,
  WidgetConfiguration,
  WIDGETS_CONFIGURATION,
} from './widget-generator.models';
import { SisModalService } from '@nuclia/sistema';
import { CopilotData, CopilotModalComponent } from './copilot/copilot-modal.component';
import { LearningConfigurationOption, RAGStrategyName } from '@nuclia/core';

const FORM_CHANGED_DEBOUNCE_TIME = 100;
const EXPANDER_CREATION_TIME = 100;

@Component({
  selector: 'app-widget-generator',
  templateUrl: 'widget-generator.component.html',
  styleUrls: ['./widget-generator.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetGeneratorComponent implements OnInit, OnDestroy {
  private localStorage = inject(LOCAL_STORAGE);
  private unsubscribeAll = new Subject<void>();
  private currentKbId = '';
  private readonly widgetConfigurations: { [kbId: string]: WidgetConfiguration };

  // TODO: remove when all LLMs support citation
  // REMINDER: also fix the translation key: widget.generator.advanced.generative-answer-category.citations.help
  LLMS_WITH_CITATION_SUPPORT: string[] | undefined = [
    'anthropic',
    'chatgpt-azure',
    'chatgpt-azure-3',
    'gemini-pro',
    'claude-3',
    'claude-3-fast',
  ];

  selectedTab: 'preset' | 'advanced' = 'preset';
  copyButtonLabel = 'generic.copy';
  copyButtonActive = false;

  isPrivateKb = this.sdk.currentKb.pipe(map((kb) => kb.state === 'PRIVATE'));
  isKbAdmin = this.sdk.currentKb.pipe(map((kb) => !!kb.admin));

  generativeModels: LearningConfigurationOption[] = [];
  snippetOverlayOpen = false;
  snippet = '';
  snippetPreview: SafeHtml = '';
  currentQuery = '';
  defaultModelFromSettings = '';
  defaultPromptFromSettings = '';
  isDefaultPromptFromSettingsApplied = true;

  // FEATURES AVAILABILITY
  isUserPromptsEnabled = this.featuresService.userPrompts;
  autocompleteFromNerEnabled = this.featuresService.suggestEntities;
  isTrainingEnabled = this.featuresService.training;
  areSynonymsEnabled = this.featuresService.synonyms;
  isKnowledgeGraphEnabled = this.featuresService.knowledgeGraph;
  canHideLogo = this.sdk.currentAccount.pipe(
    map((account) =>
      ['stash-growth', 'stash-startup', 'stash-enterprise', 'v3growth', 'v3enterprise'].includes(account.type),
    ),
  );
  clipboardSupported = !!(navigator.clipboard && navigator.clipboard.writeText);

  presetAccordionExpanded: PresetAccordionType = 'preset';
  presetList: Observable<PresetType[]> = this.isKnowledgeGraphEnabled.pipe(
    map((enabled) => (enabled ? ['search', 'find', 'ask', 'discover'] : ['search', 'find', 'ask'])),
  );
  presetForm = new FormGroup({
    preset: new FormControl<PresetType | null>(null),
    location: new FormControl<'public' | 'application' | null>(null),
    answerOutput: new FormControl<'onlyAnswers' | 'answerAndResults' | null>(null),
  });

  copilotData?: CopilotData;

  // WARNING: for isModifiedConfig function to work properly, the properties in DEFAULT_CONFIGURATION must be
  // in the EXACT SAME order as the properties declared in advancedForm in widget generator page.
  // Controls have the name expected by the widget features list
  advancedForm = new FormGroup({
    answers: new FormControl<boolean>(false, { nonNullable: true }),
    userPrompt: new FormControl<string>('', {
      nonNullable: true,
      updateOn: 'blur',
      validators: [Validators.pattern(/\{.+\}/)],
    }),
    citations: new FormControl<boolean>(false, { nonNullable: true }),
    hideResults: new FormControl<boolean>(false, { nonNullable: true }),
    noBM25forChat: new FormControl<boolean>(false, { nonNullable: true }),
    ragSpecificFieldIds: new FormControl<string>('', { nonNullable: true, updateOn: 'blur' }),
    filter: new FormControl<boolean>(false, { nonNullable: true }),
    autofilter: new FormControl<boolean>(false, { nonNullable: true }),
    preselectedFilters: new FormControl<string>('', { nonNullable: true, updateOn: 'blur' }),
    useSynonyms: new FormControl<boolean>(false, { nonNullable: true }),
    suggestions: new FormControl<boolean>(false, { nonNullable: true }),
    suggestLabels: new FormControl<boolean>(false, { nonNullable: true }),
    permalink: new FormControl<boolean>(false, { nonNullable: true }),
    navigateToLink: new FormControl<boolean>(false, { nonNullable: true }),
    navigateToFile: new FormControl<boolean>(false, { nonNullable: true }),
    placeholder: new FormControl<string>('', { nonNullable: true, updateOn: 'blur' }),
    displayMetadata: new FormControl<boolean>(false, { nonNullable: true }),
    hideThumbnails: new FormControl<boolean>(false, { nonNullable: true }),
    darkMode: new FormControl<boolean>(false, { nonNullable: true }),
    hideLogo: new FormControl<boolean>(false, { nonNullable: true }),
    autocompleteFromNERs: new FormControl<boolean>(false, { nonNullable: true }),
    relations: new FormControl<boolean>(false, { nonNullable: true }),
    knowledgeGraph: new FormControl<boolean>(false, { nonNullable: true }),
    notEnoughDataMessage: new FormControl<string>('', { nonNullable: true, updateOn: 'blur' }),
    generativeModelToggle: new FormControl<boolean>(false, { nonNullable: true }),
    generativeModel: new FormControl<string>('', { nonNullable: true }),
  });
  userPromptErrors = { pattern: 'widget.generator.advanced.generative-answer-category.prompt.error' };
  private readonly notFeatures = [
    'userPrompt',
    'preselectedFilters',
    'darkMode',
    'placeholder',
    'ragSpecificFieldIds',
    'notEnoughDataMessage',
    'generativeModel',
    'generativeModelToggle',
  ];

  // advanced options not managed directly in the form
  filters: FilterSelectionType = DEFAULT_FILTERS;
  ragStrategiesToggles = {
    field_extension: false,
    full_resource: false,
  };
  isModified = false;

  // indicators for updating expanders
  answerGenerationExpanderUpdated = new Subject<unknown>();
  searchFilteringExpanderUpdated = new Subject<unknown>();

  // FLAGS FOR CONDITIONAL FIELDS AND FEATURES
  get answerGenerationEnabled() {
    return this.advancedForm.controls.answers.value;
  }
  get filtersEnabled() {
    return this.advancedForm.controls.filter.value;
  }
  get navigateToLinkEnabled() {
    return this.advancedForm.controls.navigateToLink.value;
  }
  get navigateToFilesEnabled() {
    return this.advancedForm.controls.navigateToFile.value;
  }
  get darkModeEnabled() {
    return this.advancedForm.controls.darkMode.value;
  }
  get hideLogoEnabled() {
    return this.advancedForm.controls.hideLogo.value;
  }
  get selectedPreset() {
    return this.presetForm.controls.preset.value;
  }
  get generativeModelEnabled() {
    return this.advancedForm.controls.generativeModelToggle.value;
  }

  // ADVANCED FORM VALUES ACCESSORS
  get userPrompt() {
    return this.advancedForm.controls.userPrompt.value;
  }
  get placeholder() {
    return this.advancedForm.controls.placeholder.value;
  }
  get preselectedFilters() {
    return this.advancedForm.controls.preselectedFilters.value;
  }
  get ragSpecificFieldIds() {
    return this.advancedForm.controls.ragSpecificFieldIds.value;
  }
  get notEnoughDataMessage() {
    return this.advancedForm.controls.notEnoughDataMessage.value;
  }
  get generativeModel() {
    return this.advancedForm.controls.generativeModel.value;
  }

  get hasOneFilter(): boolean {
    return Object.entries(this.filters).filter(([, value]) => value).length === 1;
  }
  get filtersValue(): string {
    return Object.entries(this.filters)
      .filter(([, value]) => value)
      .map(([key]) => key)
      .join(',');
  }
  get features() {
    return Object.entries(this.advancedForm.getRawValue()).reduce((features, [feature, enabled]) => {
      if (enabled && !this.notFeatures.includes(feature)) {
        features = `${features.length > 0 ? features + ',' : ''}${feature}`;
      }
      return features;
    }, '');
  }
  get answersAndResultsSelected(): boolean {
    return this.presetForm.controls.answerOutput.value === 'answerAndResults';
  }

  // FORMS CONTROLS ACCESSORS
  get useSynonymsControl() {
    return this.advancedForm.controls.useSynonyms;
  }
  get relationsControl() {
    return this.advancedForm.controls.relations;
  }
  get userPromptControl() {
    return this.advancedForm.controls.userPrompt;
  }
  get citationsControl() {
    return this.advancedForm.controls.citations;
  }
  get hideResultsControl() {
    return this.advancedForm.controls.hideResults;
  }
  get noBM25forChatControl() {
    return this.advancedForm.controls.noBM25forChat;
  }
  get ragSpecificFieldIdsControl() {
    return this.advancedForm.controls.ragSpecificFieldIds;
  }
  get notEnoughDataMessageControl() {
    return this.advancedForm.controls.notEnoughDataMessage;
  }
  get generativeModelControl() {
    return this.advancedForm.controls.generativeModel;
  }

  constructor(
    private sdk: SDKService,
    private featuresService: FeaturesService,
    private cdr: ChangeDetectorRef,
    private sanitized: DomSanitizer,
    private backendConfig: BackendConfigurationService,
    private translate: TranslateService,
    private modalService: SisModalService,
  ) {
    const config = this.localStorage.getItem(WIDGETS_CONFIGURATION);
    if (config) {
      try {
        this.widgetConfigurations = JSON.parse(config);
      } catch (error) {
        this.widgetConfigurations = {};
        this.localStorage.setItem(WIDGETS_CONFIGURATION, '{}');
      }
    } else {
      this.widgetConfigurations = {};
    }
  }

  ngOnInit() {
    this.answerGenerationExpanderUpdated.pipe(takeUntil(this.unsubscribeAll)).subscribe(() => this.cdr.detectChanges());
    this.searchFilteringExpanderUpdated.pipe(takeUntil(this.unsubscribeAll)).subscribe(() => this.cdr.detectChanges());

    this.sdk.currentKb
      .pipe(
        takeUntil(this.unsubscribeAll),
        switchMap((kb) =>
          forkJoin([
            kb.getLearningSchema(),
            kb.getConfiguration(),
            this.featuresService.citationsForAllEnabled.pipe(take(1)),
          ]),
        ),
      )
      .subscribe(([schema, config, isCitationsForAllEnabled]) => {
        this.generativeModels = schema['generative_model']?.options || [];
        this.defaultModelFromSettings = config['generative_model'] || '';
        const promptKey = this.generativeModels.find((model) => model.value === this.defaultModelFromSettings)
          ?.user_prompt;
        this.defaultPromptFromSettings = promptKey ? config['user_prompts']?.[promptKey]?.['prompt'] || '' : '';
        // TODO: remove when all LLMs support citation
        if (isCitationsForAllEnabled) {
          this.LLMS_WITH_CITATION_SUPPORT = undefined;
        }
        if (
          this.LLMS_WITH_CITATION_SUPPORT &&
          !this.LLMS_WITH_CITATION_SUPPORT.includes(this.defaultModelFromSettings)
        ) {
          this.advancedForm.controls.citations.patchValue(false);
          this.advancedForm.controls.citations?.disable();
        }
        this.cdr.detectChanges();
      });
    this.sdk.currentKb.pipe(takeUntil(this.unsubscribeAll)).subscribe((kb) => {
      this.currentKbId = kb.id;
      const config = this.widgetConfigurations[kb.id] || {};
      if (config.filters) {
        this.filters = config.filters;
      }
      if (config.preset) {
        this.presetForm.patchValue(config.preset);
      }
      if (config.features) {
        const advancedForm = config.features;
        if (
          advancedForm.generativeModelToggle &&
          !this.generativeModels.find((model) => model.value === advancedForm.generativeModel)
        ) {
          advancedForm.generativeModel = '';
          advancedForm.generativeModelToggle = false;
        }
        this.advancedForm.patchValue(advancedForm);
      }
      if (config.rag_strategies) {
        config.rag_strategies.forEach((strategy) => {
          this.ragStrategiesToggles[strategy.name] = true;
          if (strategy.fields) {
            this.ragSpecificFieldIdsControl.patchValue(strategy.fields.join(', '));
          }
        });
      }
      if (config.copilotData) {
        this.copilotData = config.copilotData;
      }
      // generate snippet in next detection cycle
      setTimeout(() => this.updateSnippetAndStoreConfig());
    });

    // some changes in the form are causing other changes.
    // Debouncing allows to update the snippet only once after all changes are done.
    this.advancedForm.valueChanges
      .pipe(debounceTime(FORM_CHANGED_DEBOUNCE_TIME), takeUntil(this.unsubscribeAll))
      .subscribe((changes) => {
        this.setIsModified();
        this.answerGenerationExpanderUpdated.next(`${this.answerGenerationEnabled} – ${this.generativeModelEnabled}`);
        this.searchFilteringExpanderUpdated.next(this.filtersEnabled);
        this.updateSnippetAndStoreConfig();
      });

    combineLatest([
      this.presetForm.valueChanges.pipe(skip(1), debounceTime(FORM_CHANGED_DEBOUNCE_TIME)),
      this.isUserPromptsEnabled,
    ])
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe(([value, copilotEnabled]) => {
        this.updateConfigurationFromPreset(value);
        // wait for next cycle detection before changing the expanded accordion, so the actual accordion can be added to the DOM if needed
        setTimeout(() => {
          this.updateExpandedAccordion(value, copilotEnabled);
          this.cdr.detectChanges();
        }, EXPANDER_CREATION_TIME);
      });
  }

  private setIsModified() {
    if (this.selectedPreset) {
      this.isModified =
        isModifiedConfig(
          this.advancedForm.getRawValue(),
          this.getAdvancedConfigFromPreset(this.presetForm.getRawValue()),
        ) ||
        this.ragStrategiesToggles.full_resource ||
        this.ragStrategiesToggles.field_extension;
    }
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
    this.deletePreview();
  }

  selectTab(tab: 'preset' | 'advanced') {
    this.selectedTab = tab;
    if (tab === 'preset') {
      this.presetAccordionExpanded = 'preset';
    }
  }

  toggleAccordion(accordion: PresetAccordionType) {
    this.presetAccordionExpanded = this.presetAccordionExpanded === accordion ? '' : accordion;
    this.cdr.markForCheck();
  }

  toggleSnippet($event: MouseEvent | KeyboardEvent) {
    $event.stopPropagation();
    this.snippetOverlayOpen = !this.snippetOverlayOpen;
  }

  resetToPreset() {
    this.updateConfigurationFromPreset(this.presetForm.getRawValue());
    this.ragStrategiesToggles = {
      field_extension: false,
      full_resource: false,
    };
    this.isModified = false;
  }

  onFiltersChange() {
    // Wait for detection cycle to end before updating the snippet
    setTimeout(() => this.updateSnippetAndStoreConfig());
  }

  // reset options requiring answer generation to be enabled
  toggleAnswers(answerGeneration: boolean) {
    if (!answerGeneration) {
      this.userPromptControl.patchValue('');
      this.citationsControl.patchValue(false);
      this.hideResultsControl.patchValue(false);
      this.noBM25forChatControl.patchValue(false);
      Object.keys(this.ragStrategiesToggles).forEach((toggle: string) => {
        this.ragStrategiesToggles[toggle as RAGStrategyName] = false;
      });
      this.ragSpecificFieldIdsControl.patchValue('');
      this.notEnoughDataMessageControl.patchValue('');
      this.generativeModelControl.patchValue('');
    }
  }

  toggleGenerativeModels() {
    if (!this.generativeModelEnabled) {
      this.generativeModelControl.patchValue('');
    }
  }

  // deactivate relations option if synonyms option is enabled
  toggleSynonyms(useSynonyms: boolean) {
    if (useSynonyms) {
      this.relationsControl.patchValue(false);
      this.relationsControl.disable();
    } else {
      this.relationsControl.enable();
    }
  }

  // deactivate synonyms option if relations option is enabled
  toggleRelations(relations: boolean) {
    if (relations) {
      this.useSynonymsControl.patchValue(false);
      this.useSynonymsControl.disable();
    } else {
      this.useSynonymsControl.enable();
    }
  }

  copySnippet() {
    forkJoin([this.isPrivateKb.pipe(take(1)), this.isKbAdmin.pipe(take(1))])
      .pipe(
        switchMap(([isPrivate, isAdmin]) =>
          isPrivate
            ? this.modalService.openConfirm({
                title: 'widget.generator.private-kb-warning.title',
                description: isAdmin
                  ? 'widget.generator.private-kb-warning.description-admin'
                  : 'widget.generator.private-kb-warning.description',
                isDestructive: true,
                confirmLabel: this.copyButtonLabel,
              }).onClose
            : of(true),
        ),
        filter((confirmed) => {
          if (!confirmed) {
            navigator.clipboard.writeText('');
          }
          return confirmed;
        }),
      )
      .subscribe(() => {
        navigator.clipboard.writeText(this.snippet);

        this.copyButtonLabel = 'generic.copied';
        this.copyButtonActive = true;
        this.cdr.markForCheck();
        setTimeout(() => {
          this.copyButtonLabel = 'generic.copy';
          this.copyButtonActive = false;
          this.cdr.markForCheck();
        }, 1000);
      });
  }

  private updateSnippetAndStoreConfig() {
    this.generateSnippet();
    this.widgetConfigurations[this.currentKbId] = {
      features: this.advancedForm.getRawValue(),
      filters: this.filtersEnabled ? this.filters : undefined,
      preset: this.presetForm.getRawValue(),
      copilotData: this.copilotData,
    };
    if (this.ragStrategiesToggles.full_resource) {
      this.widgetConfigurations[this.currentKbId].rag_strategies = [{ name: 'full_resource' }];
    } else if (this.ragStrategiesToggles.field_extension && this.ragSpecificFieldIds) {
      this.widgetConfigurations[this.currentKbId].rag_strategies = [
        {
          name: 'field_extension',
          fields: this.ragSpecificFieldIds
            .split(',')
            .filter((id) => !!id)
            .map((id) => id.trim()),
        },
      ];
    }
    this.localStorage.setItem(WIDGETS_CONFIGURATION, JSON.stringify(this.widgetConfigurations));
    this.cdr.detectChanges();
  }

  private generateSnippet() {
    this.deletePreview();
    const placeholder = !!this.placeholder
      ? `
  placeholder="${this.placeholder}"`
      : '';
    let prompt = '';
    let copiablePrompt = '';
    const promptValue = this.userPrompt;
    if (promptValue) {
      prompt = `prompt="${promptValue}"`;
      copiablePrompt = `prompt="${promptValue.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"\n  `;
    }

    let ragStrategies = '';
    let ragFieldIds = '';
    if (this.ragStrategiesToggles.full_resource) {
      ragStrategies = 'full_resource';
    } else if (this.ragStrategiesToggles.field_extension && this.ragSpecificFieldIds) {
      ragStrategies = 'field_extension';
      ragFieldIds = this.ragSpecificFieldIds;
    }

    forkJoin([this.sdk.currentKb.pipe(take(1)), this.sdk.currentAccount.pipe(take(1))]).subscribe(([kb, account]) => {
      const zone = this.sdk.nuclia.options.standalone ? `standalone="true"` : `zone="${this.sdk.nuclia.options.zone}"`;
      const apiKey = `apikey="YOUR_API_TOKEN"`;
      const privateDetails =
        kb.state === 'PRIVATE'
          ? `
  state="${kb.state}"
  account="${account.id}"
  kbslug="${kb.slug}"
  ${apiKey}`
          : '';
      const backend = this.sdk.nuclia.options.standalone
        ? `
  backend="${this.backendConfig.getAPIURL()}"`
        : '';
      const filters = this.filtersEnabled
        ? `
  filters="${this.filtersValue}"`
        : '';
      const preselectionValue = this.preselectedFilters
        .split('\n')
        .map((filter) => filter.trim())
        .join(',');
      const preselectedFilters = preselectionValue
        ? `
  preselected_filters="${preselectionValue}"
      `
        : '';
      const ragProperties = ragFieldIds
        ? `
  rag_strategies="${ragStrategies}"
  rag_field_ids="${ragFieldIds}"
  `
        : ragStrategies
          ? `
  rag_strategies="${ragStrategies}"`
          : '';
      const notEnoughDataMessage = !!this.notEnoughDataMessage
        ? `
  not_enough_data_message="${this.notEnoughDataMessage.replace(/"/g, '&quot;')}"`
        : '';
      const generativeModel = !!this.generativeModel
        ? `
  generativemodel="${this.generativeModel}"`
        : '';
      const mode: string = this.darkModeEnabled ? `mode="dark"` : '';
      const baseSnippet = `<nuclia-search-bar ${mode}
  knowledgebox="${kb.id}"
  ${zone}
  features="${this.features}" ${ragProperties}${placeholder}${notEnoughDataMessage}${generativeModel}${filters}${preselectedFilters}${privateDetails}${backend}></nuclia-search-bar>
<nuclia-search-results ${mode}></nuclia-search-results>`;

      this.snippet = `<script src="https://cdn.nuclia.cloud/nuclia-video-widget.umd.js"></script>
${baseSnippet.replace('zone=', copiablePrompt + 'zone=')}`;
      this.snippetPreview = this.sanitized.bypassSecurityTrustHtml(
        baseSnippet
          .replace(
            'zone=',
            `client="dashboard" backend="${this.backendConfig.getAPIURL()}"
  lang="${this.translate.currentLang}"
  ${prompt}
  zone=`,
          )
          .replace('standalone=', 'client="dashboard" standalone=')
          .replace(apiKey, '')
          .replace('<nuclia-search-results', '<nuclia-search-results scrollableContainerSelector=".preview-content"'),
      );
    });

    this.cdr.detectChanges();

    // Run the search with the current query if any
    setTimeout(() => {
      const searchWidget = document.getElementsByTagName('nuclia-search-bar')[0] as unknown as any;
      if (this.currentQuery) {
        searchWidget?.search(this.currentQuery);
      }
      searchWidget?.addEventListener('search', (event: { detail: string }) => {
        this.currentQuery = event.detail;
      });
    }, 500);
  }

  private deletePreview() {
    const searchWidgetElement = document.querySelector('nuclia-search') as any;
    const searchBarElement = document.querySelector('nuclia-search-bar') as any;
    const searchResultsElement = document.querySelector('nuclia-search-results') as any;
    if (typeof searchWidgetElement?.$$c?.$destroy === 'function') {
      searchWidgetElement.$$c.$destroy();
    }
    if (typeof searchBarElement?.$$c?.$destroy === 'function') {
      searchBarElement.$$c.$destroy();
    }
    if (typeof searchResultsElement?.$$c?.$destroy === 'function') {
      searchResultsElement.$$c.$destroy();
    }
    searchWidgetElement?.remove();
    searchBarElement?.remove();
    searchResultsElement?.remove();
  }

  private updateConfigurationFromPreset(value: Partial<PresetForm>) {
    const config = this.getAdvancedConfigFromPreset(value);
    this.filters = DEFAULT_FILTERS;
    // keep the few display options which are not managed by presets
    config.darkMode = this.darkModeEnabled;
    config.hideLogo = this.hideLogoEnabled;
    this.advancedForm.patchValue(config);
    this.cdr.detectChanges();
  }

  private getAdvancedConfigFromPreset(value: Partial<PresetForm>): AdvancedForm {
    switch (value.preset) {
      case 'search':
        return getSearchPresetConfig(value);
      case 'find':
        return getFindPresetConfig(value);
      case 'ask':
        return getAskPresetConfig(value);
      case 'discover':
        return getDiscoverConfig();
      default:
        return { ...DEFAULT_CONFIGURATION };
    }
  }

  private updateExpandedAccordion(value: Partial<PresetForm>, copilotEnabled: boolean) {
    switch (this.presetAccordionExpanded) {
      case 'preset':
        if (value.preset === 'search' || value.preset === 'find') {
          this.presetAccordionExpanded = 'location';
        } else if (value.preset === 'ask') {
          this.presetAccordionExpanded = 'answerOutput';
        }
        break;
      case 'answerOutput':
        if (copilotEnabled) {
          this.presetAccordionExpanded = 'copilot';
        } else if (value.answerOutput === 'answerAndResults') {
          this.presetAccordionExpanded = 'location';
        }
        break;
      case 'copilot':
        if (value.answerOutput === 'answerAndResults') {
          this.presetAccordionExpanded = 'location';
        }
        break;
    }
  }

  openCopilotModal() {
    this.modalService
      .openModal(CopilotModalComponent, { dismissable: false, data: this.copilotData })
      .onClose.subscribe((result?: CopilotData) => {
        if (result) {
          this.copilotData = result;
          this.advancedForm.patchValue({
            userPrompt: result.prompt,
            preselectedFilters: result.filters,
          });
          this.cdr.markForCheck();
        }
      });
  }

  updateRagStrategies(toggle: 'full_resource' | 'field_extension', enabled: boolean) {
    this.ragStrategiesToggles[toggle] = enabled;
    if (enabled) {
      if (toggle === 'full_resource') {
        this.ragStrategiesToggles.field_extension = false;
        this.ragSpecificFieldIdsControl.patchValue('');
      } else {
        this.ragStrategiesToggles.full_resource = false;
      }
    }
    this.answerGenerationExpanderUpdated.next({ ...this.ragStrategiesToggles });
    this.setIsModified();
    setTimeout(() => this.updateSnippetAndStoreConfig());
  }

  onResizingTextarea($event: DOMRect) {
    this.answerGenerationExpanderUpdated.next($event);
    this.searchFilteringExpanderUpdated.next($event);
  }

  onUserPromptChange() {
    this.checkDefaultPromptFromSettingsApplied();
  }
  changeLLM(llm: string) {
    if (this.LLMS_WITH_CITATION_SUPPORT && !this.LLMS_WITH_CITATION_SUPPORT.includes(llm)) {
      this.advancedForm.controls.citations.patchValue(false);
      this.advancedForm.controls.citations?.disable();
    } else {
      this.advancedForm.controls.citations?.enable();
    }
    this.checkDefaultPromptFromSettingsApplied();
    this.cdr.detectChanges();
  }

  private checkDefaultPromptFromSettingsApplied() {
    this.isDefaultPromptFromSettingsApplied =
      (!this.advancedForm.controls.generativeModel.value ||
        this.defaultModelFromSettings === this.advancedForm.controls.generativeModel.value) &&
      this.userPrompt === '';
  }
}
