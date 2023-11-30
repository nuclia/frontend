import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { BackendConfigurationService, FeatureFlagService, SDKService, STFTrackingService } from '@flaps/core';
import { combineLatest, forkJoin, map, Observable, of, Subject, take } from 'rxjs';
import { TranslateService } from '@guillotinaweb/pastanaga-angular';
import { LOCAL_STORAGE } from '@ng-web-apis/common';
import { NavigationService } from '@flaps/common';
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

  selectedTab: 'preset' | 'advanced' = 'preset';
  copyButtonLabel = 'generic.copy';
  copyButtonActive = false;

  showWarning = this.sdk.currentKb.pipe(map((kb) => kb.state === 'PRIVATE'));
  showLink = this.sdk.currentKb.pipe(map((kb) => !!kb.admin && kb.state === 'PRIVATE'));
  homeUrl = this.navigation.homeUrl;

  snippetOverlayOpen = false;
  snippet = '';
  snippetPreview: SafeHtml = '';
  currentQuery = '';

  // FEATURES AVAILABILITY
  isAiCopilotEnabled: Observable<boolean> = of(false); // TODO add real feature flag once this copilot feature is implemented
  isUserPromptsEnabled = forkJoin([
    this.featureFlag.isFeatureEnabled('user-prompts').pipe(take(1)),
    this.sdk.currentAccount.pipe(
      map((account) => ['stash-growth', 'stash-enterprise'].includes(account.type)),
      take(1),
    ),
  ]).pipe(map(([hasFlag, isAtLeastGrowth]) => hasFlag || isAtLeastGrowth));
  autocompleteFromNerEnabled = this.tracking.isFeatureEnabled('suggest-entities');
  isTrainingEnabled = this.tracking.isFeatureEnabled('training');
  areSynonymsEnabled = this.sdk.currentAccount.pipe(
    map((account) => account.type),
    map((accountType) => !!accountType && ['stash-growth', 'stash-startup', 'stash-enterprise'].includes(accountType)),
  );
  isKnowledgeGraphEnabled = this.tracking.isFeatureEnabled('knowledge-graph');
  canHideLogo = this.sdk.currentAccount.pipe(
    map((account) => ['stash-growth', 'stash-startup', 'stash-enterprise'].includes(account.type)),
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

  // controls have the name expected by the widget features list
  advancedForm = new FormGroup({
    answers: new FormControl<boolean>(false, { nonNullable: true }),
    userPrompt: new FormControl<string>('', {
      nonNullable: true,
      updateOn: 'blur',
      validators: [Validators.pattern(/\{.+\}/)],
    }),
    hideSources: new FormControl<boolean>(false, { nonNullable: true }),
    onlyAnswers: new FormControl<boolean>(false, { nonNullable: true }),
    noBM25forChat: new FormControl<boolean>(false, { nonNullable: true }),
    filter: new FormControl<boolean>(false, { nonNullable: true }),
    autofilter: new FormControl<boolean>(false, { nonNullable: true }),
    preselectedFilters: new FormControl<string>('', { nonNullable: true }),
    useSynonyms: new FormControl<boolean>(false, { nonNullable: true }),
    suggestions: new FormControl<boolean>(false, { nonNullable: true }),
    suggestLabels: new FormControl<boolean>(false, { nonNullable: true }),
    permalink: new FormControl<boolean>(false, { nonNullable: true }),
    navigateToLink: new FormControl<boolean>(false, { nonNullable: true }),
    navigateToFile: new FormControl<boolean>(false, { nonNullable: true }),
    targetNewTab: new FormControl<boolean>(false, { nonNullable: true }),
    placeholder: new FormControl<string>('', { nonNullable: true, updateOn: 'blur' }),
    displayMetadata: new FormControl<boolean>(false, { nonNullable: true }),
    hideThumbnails: new FormControl<boolean>(false, { nonNullable: true }),
    darkMode: new FormControl<boolean>(false, { nonNullable: true }),
    hideLogo: new FormControl<boolean>(false, { nonNullable: true }),
    autocompleteFromNERs: new FormControl<boolean>(false, { nonNullable: true }),
    relations: new FormControl<boolean>(false, { nonNullable: true }),
    knowledgeGraph: new FormControl<boolean>(false, { nonNullable: true }),
  });
  userPromptErrors = { pattern: 'widget.generator.advanced.generative-answer-category.prompt.description' };
  private readonly notFeatures = ['userPrompt', 'preselectedFilters', 'darkMode', 'placeholder'];

  // advanced options not managed directly in the form
  filters: FilterSelectionType = DEFAULT_FILTERS;
  isModified = false;

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
  get hideSourcesControl() {
    return this.advancedForm.controls.hideSources;
  }
  get onlyAnswersControl() {
    return this.advancedForm.controls.onlyAnswers;
  }
  get noBM25forChatControl() {
    return this.advancedForm.controls.noBM25forChat;
  }
  get targetNewTabControl() {
    return this.advancedForm.controls.targetNewTab;
  }

  constructor(
    private sdk: SDKService,
    private featureFlag: FeatureFlagService,
    private tracking: STFTrackingService,
    private cdr: ChangeDetectorRef,
    private sanitized: DomSanitizer,
    private backendConfig: BackendConfigurationService,
    private translate: TranslateService,
    private navigation: NavigationService,
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
        this.advancedForm.patchValue(config.features);
      }
      // generate snippet in next detection cycle
      setTimeout(() => this.updateSnippetAndStoreConfig());
    });

    // some changes in the form are causing other changes.
    // Debouncing allows to update the snippet only once after all changes are done.
    this.advancedForm.valueChanges
      .pipe(debounceTime(FORM_CHANGED_DEBOUNCE_TIME), takeUntil(this.unsubscribeAll))
      .subscribe((changes) => {
        console.log('advancedForm.valueChanges', changes);
        if (this.selectedPreset) {
          this.isModified = isModifiedConfig(
            this.advancedForm.getRawValue(),
            this.getAdvancedConfigFromPreset(this.presetForm.getRawValue()),
          );
        }
        this.updateSnippetAndStoreConfig();
      });

    combineLatest([
      this.presetForm.valueChanges.pipe(debounceTime(FORM_CHANGED_DEBOUNCE_TIME)),
      this.isAiCopilotEnabled,
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

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
    this.deletePreview();
  }

  onChange(event: Event) {
    console.log('onChange', event);
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
  }

  onFiltersChange() {
    // Wait for detection cycle to end before updating the snippet
    setTimeout(() => this.updateSnippetAndStoreConfig());
  }

  // reset options requiring answer generation to be enabled
  toggleAnswers(answerGeneration: boolean) {
    if (!answerGeneration) {
      this.userPromptControl.patchValue('');
      this.hideSourcesControl.patchValue(false);
      this.onlyAnswersControl.patchValue(false);
      this.noBM25forChatControl.patchValue(false);
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

  navigateToChanged() {
    if (!this.navigateToLinkEnabled && !this.navigateToFilesEnabled) {
      this.targetNewTabControl.patchValue(false);
    }
  }

  copySnippet() {
    navigator.clipboard.writeText(this.snippet);

    this.copyButtonLabel = 'generic.copied';
    this.copyButtonActive = true;
    this.cdr.markForCheck();
    setTimeout(() => {
      this.copyButtonLabel = 'generic.copy';
      this.copyButtonActive = false;
      this.cdr.markForCheck();
    }, 1000);
  }

  private updateSnippetAndStoreConfig() {
    this.generateSnippet();
    this.widgetConfigurations[this.currentKbId] = {
      features: this.advancedForm.getRawValue(),
      filters: this.filtersEnabled ? this.filters : undefined,
      preset: this.presetForm.getRawValue(),
    };
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
      copiablePrompt = `prompt="${promptValue.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"\n`;
    }

    this.sdk.currentKb.pipe(take(1)).subscribe((kb) => {
      const zone = this.sdk.nuclia.options.standalone ? `standalone="true"` : `zone="${this.sdk.nuclia.options.zone}"`;
      const apiKey = `apikey="YOUR_API_TOKEN"`;
      const privateDetails =
        kb.state === 'PRIVATE'
          ? `
  state="${kb.state}"
  account="${kb.account}"
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
      const mode: string = this.darkModeEnabled ? `mode="dark"` : '';
      const baseSnippet = `<nuclia-search-bar ${mode}
  knowledgebox="${kb.id}"
  ${zone}
  features="${this.features}" ${placeholder}${filters}${preselectedFilters}${privateDetails}${backend}></nuclia-search-bar>
<nuclia-search-results ${mode}></nuclia-search-results>`;

      this.snippet = `<script src="https://cdn.nuclia.cloud/nuclia-video-widget.umd.js"></script>
${baseSnippet.replace('zone=', copiablePrompt + '  zone=')}`;
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
          .replace(apiKey, ''),
      );
    });

    this.cdr.detectChanges();

    // Run the search with the current query if any
    setTimeout(() => {
      const searchWidget = document.getElementsByTagName('nuclia-search-bar')[0] as unknown as any;
      if (this.currentQuery) {
        searchWidget?.search(this.currentQuery);
      }
      searchWidget?.addEventListener('search', (query: string) => {
        // FIXME make sure this is working as part of https://app.shortcut.com/flaps/story/7916/dispatchcustomevent-doesn-t-work-anymore
        this.currentQuery = query;
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
}
