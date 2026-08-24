import { CommonModule } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
  Pipe,
  PipeTransform,
  signal,
  ViewChild,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FeaturesService, SDKService, STFUtils } from '@flaps/core';
import {
  AccordionBodyDirective,
  AccordionComponent,
  AccordionItemComponent,
  ModalConfig,
  OptionModel,
  OptionSeparator,
  OptionType,
  PaButtonModule,
  PaDropdownModule,
  PaPopupModule,
  PaTextFieldModule,
  PaTogglesModule,
  PaTooltipModule,
  PaIconModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  LearningConfigurations,
  GenerativeProviders,
  SearchConfig,
  Widget,
  AgenticSource,
  WritableKnowledgeBox,
  DEFAULT_SEARCH_BOX_CONFIG,
  DEFAULT_GENERATIVE_ANSWER_CONFIG,
  DEFAULT_RESULT_DISPLAY_CONFIG,
  DEFAULT_ROUTING_CONFIG,
} from '@nuclia/core';
import {
  BadgeComponent,
  ButtonMiniComponent,
  ExpandableTextareaComponent,
  InfoCardComponent,
  SisModalService,
  SisToastService,
} from '@nuclia/sistema';
import { catchError, filter, forkJoin, map, Observable, of, Subject, switchMap, take, tap } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { removeDeprecatedModels } from '../../ai-models/ai-models.utils';
import { getAgenticChatOptions, getChatOptions, getFindOptions, isSameConfigurations } from '../search-widget.models';
import { SearchWidgetService } from '../search-widget.service';
import { AgenticConfigurationComponent } from './agentic-configuration';
import { GenerativeAnswerFormComponent } from './generative-answer-form';
import { ResultsDisplayFormComponent } from './results-display-form';
import { SaveConfigModalComponent } from './save-config-modal/save-config-modal.component';
import { SearchBoxFormComponent } from './search-box-form';
import { SearchRequestModalComponent } from './search-request-modal';
import { RoutingFormComponent } from './routing-form/routing-form.component';

const NUCLIA_SEMANTIC_MODELS = new Set(['ENGLISH', 'MULTILINGUAL', 'MULTILINGUAL_ALPHA']);

@Pipe({ name: 'isTypedConfig' })
export class IsTypedConfigPipe implements PipeTransform {
  transform(value?: Widget.AnySearchConfiguration): value is Widget.TypedSearchConfiguration {
    return value?.type === 'config';
  }
}

@Component({
  selector: 'stf-search-configuration',
  imports: [
    CommonModule,
    AccordionComponent,
    AccordionBodyDirective,
    AccordionItemComponent,
    BadgeComponent,
    ButtonMiniComponent,
    InfoCardComponent,
    PaButtonModule,
    PaDropdownModule,
    PaPopupModule,
    PaTextFieldModule,
    PaTooltipModule,
    ReactiveFormsModule,
    SearchBoxFormComponent,
    GenerativeAnswerFormComponent,
    ResultsDisplayFormComponent,
    RoutingFormComponent,
    RouterLink,
    TranslateModule,
    PaTooltipModule,
    PaTogglesModule,
    PaIconModule,
    IsTypedConfigPipe,
    ExpandableTextareaComponent,
    AgenticConfigurationComponent,
  ],
  templateUrl: './search-configuration.component.html',
  styleUrl: './search-configuration.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchConfigurationComponent implements OnInit, OnDestroy {
  private cdr = inject(ChangeDetectorRef);
  private sdk = inject(SDKService);
  private translate = inject(TranslateService);
  private modalService = inject(SisModalService);
  private searchWidgetService = inject(SearchWidgetService);
  private toaster = inject(SisToastService);
  private features = inject(FeaturesService);

  private unsubscribeAll = new Subject<void>();

  @Input({ transform: booleanAttribute }) displayWidgetButtonLine = false;
  @Input({ transform: booleanAttribute }) onlySupportedConfigs = false;
  @Input() configurationContainer?: ElementRef;
  @Input() mainTitle = '';
  @Input() bottomSectionStyle = '';

  @Output() configUpdate = new EventEmitter<Widget.AnySearchConfiguration>();
  @Output() createWidget = new EventEmitter<void>();

  @ViewChild('agenticConfig', { read: AccordionItemComponent }) agenticConfigItem?: AccordionItemComponent;
  @ViewChild(AgenticConfigurationComponent) agenticConfigComponent?: AgenticConfigurationComponent;
  @ViewChild('searchBox', { read: AccordionItemComponent }) searchBoxItem?: AccordionItemComponent;
  @ViewChild('generativeAnswer', { read: AccordionItemComponent }) generativeAnswerItem?: AccordionItemComponent;
  @ViewChild('results', { read: AccordionItemComponent }) resultsItem?: AccordionItemComponent;
  @ViewChild('routing', { read: AccordionItemComponent }) routingItem?: AccordionItemComponent;

  @HostBinding('class.bigger-gap') get hasWidgetLine() {
    return this.displayWidgetButtonLine;
  }

  isRagLabAuthorized = this.features.authorized.promptLab;
  isRoutingEnabled = this.features.unstable.routing;
  isAgenticSearchEnabled = this.features.unstable.agenticSearch;
  configurations: OptionType[] = [];

  selectedConfig = new FormControl<string>('');

  savedConfig?: Widget.AnySearchConfiguration;
  currentConfig?: Widget.AnySearchConfiguration;
  originalJsonConfig?: string;
  currentJsonConfig?: string;
  useGenerativeAnswer = false;

  generativeModelFromSettings = '';
  semanticModelFromSettings = '';
  generativeModelNames: { [key: string]: string } = {};
  generativeProviders: GenerativeProviders = {};
  learningConfigurations: LearningConfigurations = {};
  semanticModels: OptionModel[] = [];
  promptInfos: { [model: string]: string } = {};
  defaultPromptFromSettings = '';
  defaultSystemPromptFromSettings = '';
  lastQuery?: { [key: string]: any };

  initialised = false;

  isConfigModified = false;
  isConfigUnsupported = false;
  canModifyConfig = this.features.isKbAdmin;
  ignoreChanges = false;
  ignoreNextRoutingRefresh = false;

  searchMode = signal<'agentic' | 'simple-rag' | 'search'>('simple-rag');
  currentKbSource = signal<{ id: string; label: string } | null>(null);
  agenticWidgetConfigNames = signal<string[]>([]);
  agenticSourcesValid = signal(true);
  agenticSourcesRequiredWarning = signal(false);
  pendingAgenticSource = signal<{ title: string; description: string } | undefined>(undefined);

  get isNucliaConfig() {
    return this.selectedConfig.value?.startsWith('nuclia-');
  }

  ngOnInit() {
    this.sdk.currentKb
      .pipe(
        take(1),
        tap((kb) => this.currentKbSource.set({ id: kb.id, label: kb.title })),
        switchMap((kb) => {
          return forkJoin([kb.getLearningSchema(), kb.getConfiguration(), kb.getGenerativeProviders()]).pipe(
            map(
              ([schema, config, providers]) =>
                ({
                  schema: removeDeprecatedModels(schema),
                  config,
                  providers,
                }) as {
                  config: { [id: string]: any };
                  schema: LearningConfigurations;
                  providers: GenerativeProviders;
                },
            ),
          );
        }),
        tap(({ schema, config, providers }) => {
          this.generativeModelFromSettings = config['generative_model'] || '';
          this.semanticModelFromSettings = config['default_semantic_model'] || '';
          this.generativeProviders = providers;
          this.learningConfigurations = schema;
          this.generativeModelNames =
            schema['generative_model']?.options?.reduce(
              (acc, model) => {
                acc[model.value] = model.name;
                return acc;
              },
              {} as { [key: string]: string },
            ) || {};
          this.setModelsAndPrompt(schema, config);
          this.initialised = true;
          this.cdr.detectChanges();
        }),
        switchMap(() => this.setConfigurations()),
      )
      .subscribe({
        error: () => this.toaster.error('search.configuration.loading-error'),
      });
    this.searchWidgetService.logs
      .pipe(
        takeUntil(this.unsubscribeAll),
        filter((logs) => !!logs['lastQuery']),
        map((logs) => logs['lastQuery']),
      )
      .subscribe((lastQuery) => {
        this.lastQuery = lastQuery;
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  private setConfigurations() {
    return forkJoin([
      this.sdk.currentKb.pipe(take(1)),
      this.onlySupportedConfigs
        ? this.searchWidgetService.supportedSearchConfigurations.pipe(take(1))
        : this.searchWidgetService.searchConfigurations.pipe(take(1)),
    ]).pipe(
      tap(([kb, savedConfigs]) => {
        const standardConfigOption = new OptionModel({
          id: 'nuclia-standard',
          value: 'nuclia-standard',
          label: this.translate.instant('search.configuration.options.nuclia-standard'),
          help: this.generativeModelNames[this.generativeModelFromSettings] || this.generativeModelFromSettings,
        });

        const configurations: OptionType[] = [standardConfigOption];
        if (savedConfigs.length > 0) {
          configurations.push(new OptionSeparator());
        }
        this.configurations = configurations.concat(
          savedConfigs.map(
            (item) =>
              new OptionModel({
                id: item.id,
                value: item.id,
                label: item.id,
                help:
                  item.type === 'config'
                    ? this.generativeModelNames[item.generativeAnswer?.generativeModel || ''] ||
                      item.generativeAnswer?.generativeModel
                    : undefined,
              }),
          ),
        );

        const savedConfig = this.searchWidgetService.getSelectedSearchConfig(kb.id, savedConfigs);
        this.savedConfig = savedConfig;
        this._syncModeSignals(savedConfig);
        this.agenticWidgetConfigNames.set(
          savedConfigs
            .filter((c) => c.type === 'config' && (c as Widget.TypedSearchConfiguration).searchMode === 'agentic')
            .map((c) => c.id),
        );
        // config selection must be done in next check detection cycle for selection options to be there
        setTimeout(() => this.selectedConfig.patchValue(savedConfig.id));
      }),
    );
  }

  private setModelsAndPrompt(schema: LearningConfigurations, config: { [key: string]: any }) {
    const generativeModels = schema['generative_model']?.options || [];
    const semanticModelsName = (schema['semantic_models'].options || []).reduce(
      (names, model) => {
        names[model.value] = model.name;
        return names;
      },
      {} as { [value: string]: string },
    );
    this.semanticModels = (config['semantic_models'] || []).map((model: string) => {
      const isNucliaModel = NUCLIA_SEMANTIC_MODELS.has(semanticModelsName[model]);
      const help = isNucliaModel
        ? this.translate.instant('user.kb.creation-form.models.options.' + semanticModelsName[model])
        : model;
      return new OptionModel({
        id: model,
        value: model,
        label: isNucliaModel
          ? `Nuclia ${model}`
          : this.translate.instant('user.kb.creation-form.models.options.' + semanticModelsName[model]),
        help:
          this.semanticModelFromSettings === model
            ? `${help} ${this.translate.instant('search.configuration.generative-answer.generative-model.kb-settings')}`
            : help,
      });
    });
    const promptInfos = Object.entries(schema['user_prompts']?.schemas || {}).reduce(
      (infos, [prompt, schema]) => {
        if (schema.properties['prompt']?.info) {
          infos[prompt] = schema.properties['prompt']?.info;
        }
        return infos;
      },
      {} as { [prompt: string]: string },
    );
    this.promptInfos = generativeModels
      .filter((model) => !!model.user_prompt && model.user_prompt !== 'none')
      .reduce(
        (infoByModel, model) => {
          infoByModel[model.value] = promptInfos[model.user_prompt as string];
          return infoByModel;
        },
        {} as { [model: string]: string },
      );
    const promptKey = generativeModels.find((model) => model.value === this.generativeModelFromSettings)?.user_prompt;
    this.defaultPromptFromSettings = promptKey ? config['user_prompts']?.[promptKey]?.['prompt'] || '' : '';
    this.defaultSystemPromptFromSettings = promptKey ? config['user_prompts']?.[promptKey]?.['system'] || '' : '';
  }

  selectConfig(configId: string) {
    forkJoin([this.searchWidgetService.searchConfigurations.pipe(take(1)), this.sdk.currentKb.pipe(take(1))])
      .pipe(
        switchMap(([configs, kb]) => {
          // saveSelectedSearchConfig must run before getSelectedSearchConfig: the latter reads the "selected id"
          // back from localStorage rather than taking configId directly, so switching configs silently no-ops
          // if the save happens after the read (as it did when this was moved into the subscribe callback).
          this.searchWidgetService.saveSelectedSearchConfig(kb.id, configId);
          const savedConfig = this.searchWidgetService.getSelectedSearchConfig(kb.id, configs);
          return this._hydrateAgenticConfig(kb, savedConfig).pipe(map((hydrated) => ({ kb, savedConfig: hydrated })));
        }),
      )
      .subscribe(({ savedConfig }) => {
        this.savedConfig = savedConfig;
        this.currentConfig = { ...this.savedConfig };
        this.isConfigModified = false;
        this._syncModeSignals(this.savedConfig);
        if (this.savedConfig.type === 'api') {
          this.isConfigUnsupported = true;
          this.originalJsonConfig = JSON.stringify(this.savedConfig.value.config, null, 2);
          this.useGenerativeAnswer = this.savedConfig.value.kind === 'ask';
        } else {
          this.isConfigUnsupported = false;
          this.originalJsonConfig = '';
        }
        this.currentJsonConfig = this.originalJsonConfig;
        this.updateWidget();
        this.cdr.markForCheck();
        // after selecting a config, all the forms trigger a value change, and as old config might not be aligned
        // with the latest supported properties, it may display a warning message to the user saying the config has changed
        // so for 200ms we just ignore any changes
        this.ignoreChanges = true;
        this.ignoreNextRoutingRefresh = true;
        setTimeout(() => (this.ignoreChanges = false), 200);
        setTimeout(() => (this.ignoreNextRoutingRefresh = false), 1000);
      });
  }

  private _hydrateAgenticConfig(
    kb: WritableKnowledgeBox,
    config: Widget.AnySearchConfiguration,
  ): Observable<Widget.AnySearchConfiguration> {
    if (
      config.type !== 'config' ||
      config.searchMode !== 'agentic' ||
      config.agentic?.config ||
      !config.agentic?.configId
    ) {
      return of(config);
    }
    const configId = config.agentic.configId;
    return kb.getAgenticConfig(configId).pipe(
      map(
        (agenticConfig) =>
          ({ ...config, agentic: { ...config.agentic, config: agenticConfig } }) as Widget.AnySearchConfiguration,
      ),
      catchError(() => {
        this.toaster.error('search.configuration.agentic.load-error');
        return of(config);
      }),
    );
  }

  private _syncModeSignals(config: Widget.AnySearchConfiguration) {
    if (config.type === 'config') {
      // backwards compatibility for older configs without searchMode
      const inferredMode = config.generativeAnswer?.generateAnswer ? 'simple-rag' : 'search';
      this.searchMode.set(config.searchMode || inferredMode);
    }
  }

  updateSearchMode(mode: 'agentic' | 'simple-rag' | 'search') {
    if (!this.savedConfig || this.currentConfig?.type !== 'config') return;
    this.searchMode.set(mode);
    const currentConfig = this.currentConfig;
    // Request kind is purely a function of mode: 'search' is always 'find', 'simple-rag' always 'ask'
    const generativeAnswer = {
      ...(currentConfig.generativeAnswer ?? DEFAULT_GENERATIVE_ANSWER_CONFIG),
      generateAnswer: mode === 'simple-rag',
    };
    this.currentConfig = {
      ...currentConfig,
      searchMode: mode,
      // Clear the stale agentic config when leaving agentic mode, otherwise it lingers in the saved config.
      agentic:
        mode === 'agentic'
          ? { ...currentConfig.agentic, configId: currentConfig.agentic?.configId || currentConfig.id }
          : undefined,
      ...(mode !== 'agentic'
        ? {
            searchBox: currentConfig.searchBox ?? { ...DEFAULT_SEARCH_BOX_CONFIG },
            generativeAnswer,
            resultDisplay: currentConfig.resultDisplay ?? { ...DEFAULT_RESULT_DISPLAY_CONFIG },
            routing: currentConfig.routing ?? { ...DEFAULT_ROUTING_CONFIG },
          }
        : {}),
    };
    if (mode !== 'agentic') {
      this.useGenerativeAnswer = generativeAnswer.generateAnswer;
    }
    this.isConfigModified = !this.ignoreChanges && !isSameConfigurations(this.currentConfig, this.savedConfig);
    this.updateWidget();
  }

  updateAgenticConfig(partial: Partial<Widget.TypedSearchConfiguration>) {
    if (!this.savedConfig || this.currentConfig?.type !== 'config') return;
    const originalSearchBox = this.currentConfig.searchBox;
    const originalAgentic = this.currentConfig.agentic;
    this.currentConfig = {
      ...this.currentConfig,
      ...partial,
      ...(partial.searchBox ? { searchBox: { ...originalSearchBox, ...partial.searchBox } } : {}),
      // Merge instead of replace so a partial emission (e.g. only `config` or only `searchConfiguration`)
      // doesn't wipe out the other agentic fields already on currentConfig.
      ...(partial.agentic ? { agentic: { ...originalAgentic, ...partial.agentic } } : {}),
    };
    this.isConfigModified = !this.ignoreChanges && !isSameConfigurations(this.currentConfig, this.savedConfig);
    this.updateWidget();
    this.updateAgenticConfigHeight();
  }

  triggerCreateWidget() {
    if (this.isConfigModified) {
      this.modalService.openConfirm({
        title: 'search.configuration.save-changes-modal.title',
        description: 'search.configuration.save-changes-modal.description',
        confirmLabel: 'Ok',
        onlyConfirm: true,
      });
    } else {
      this.createWidget.emit();
    }
  }

  resetConfig() {
    if (this.savedConfig) {
      if (this.savedConfig.type === 'config') {
        this.savedConfig = {
          type: 'config',
          id: this.savedConfig.id,
          searchMode: this.savedConfig.searchMode,
          agentic: this.savedConfig.agentic,
          searchBox: this.savedConfig.searchBox ? { ...this.savedConfig.searchBox } : undefined,
          generativeAnswer: this.savedConfig.generativeAnswer ? { ...this.savedConfig.generativeAnswer } : undefined,
          resultDisplay: this.savedConfig.resultDisplay ? { ...this.savedConfig.resultDisplay } : undefined,
          routing: this.savedConfig.routing ? { ...this.savedConfig.routing } : undefined,
        };
        this._syncModeSignals(this.savedConfig);
      } else {
        this.currentJsonConfig = this.originalJsonConfig;
        this.useGenerativeAnswer = this.savedConfig.value.kind === 'ask';
      }
      this.isConfigModified = false;
    }
  }

  saveConfig() {
    if (this.isConfigModified) {
      this.modalService
        .openModal(SaveConfigModalComponent)
        .onClose.pipe(
          filter((confirm) => !!confirm),
          switchMap((configName) => this._saveConfig(configName)),
          filter((success) => !!success),
          switchMap(() => this.setConfigurations()),
        )
        .subscribe();
    }
  }

  overwriteConfig() {
    if (this.isConfigModified && this.currentConfig) {
      this._saveConfig(this.currentConfig.id).subscribe();
    }
  }

  deleteConfig() {
    if (this.savedConfig && !this.savedConfig.id.startsWith('nuclia-')) {
      const config = this.savedConfig;
      this.modalService
        .openConfirm({
          title: this.translate.instant('search.configuration.delete-config-confirm.title', { configName: config.id }),
          description: 'search.configuration.delete-config-confirm.description',
          confirmLabel: 'generic.delete',
          isDestructive: true,
        })
        .onClose.pipe(
          filter((confirm) => !!confirm),
          switchMap(() => this.searchWidgetService.deleteSearchConfig(config.id)),
          switchMap(() => this.setConfigurations()),
        )
        .subscribe();
    }
  }

  private _saveConfig(configName: string) {
    if (this.isConfigUnsupported && this.currentConfig?.type === 'api') {
      try {
        this.currentConfig.value = {
          kind: this.useGenerativeAnswer ? 'ask' : 'find',
          config: JSON.parse(this.currentJsonConfig || ''),
        };
      } catch (e) {
        this.toaster.error('search.configuration.json-config-error');
        return of(false);
      }
    }
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) => this._ensurePendingAgenticSource(kb).pipe(map(() => kb))),
      switchMap((kb) =>
        this.currentConfig
          ? this.searchWidgetService.saveSearchConfig(kb.id, configName, this.currentConfig).pipe(
              map(() => {
                if (this.isConfigUnsupported) {
                  this.updateWidget();
                }
                this.isConfigModified = false;
                this.originalJsonConfig =
                  this.currentConfig?.type === 'api' ? JSON.stringify(this.currentConfig.value, null, 2) : '';
                return true;
              }),
            )
          : of(false),
      ),
      map((success) => {
        if (success) {
          this.updateAgenticConfigHeight();
        }
        return success;
      }),
    );
  }

  /**
   * When the agentic config has no sources yet, `AgenticConfigurationComponent` collects a title/description
   * draft (prefilled from the KB) instead of a source picker. On save, we create that KB source for real,
   * inject its id into the agentic config's `smart_agent.sources`, and let the child component know so it
   * doesn't try to recreate it on a subsequent save.
   */
  private _ensurePendingAgenticSource(kb: WritableKnowledgeBox) {
    const pending = this.pendingAgenticSource();
    const title = pending?.title.trim();
    const description = pending?.description.trim() || undefined;
    if (this.currentConfig?.type !== 'config' || this.currentConfig.searchMode !== 'agentic' || !title) {
      return of(undefined);
    }
    const id = STFUtils.generateSlug(title) || 'knowledge-box';
    const source: AgenticSource = { type: 'nucliadb', description };
    return kb.createAgenticSource(id, source).pipe(
      tap(() => {
        if (this.currentConfig?.type === 'config' && this.currentConfig.agentic?.config) {
          const sources = this.currentConfig.agentic.config.smart_agent?.sources || [];
          this.currentConfig = {
            ...this.currentConfig,
            agentic: {
              ...this.currentConfig.agentic,
              config: {
                ...this.currentConfig.agentic.config,
                smart_agent: {
                  ...this.currentConfig.agentic.config.smart_agent,
                  sources: sources.includes(id) ? sources : [...sources, id],
                },
              },
            },
          };
        }
        this.agenticConfigComponent?.applyCreatedSource(id, description || '');
        this.pendingAgenticSource.set(undefined);
      }),
      map(() => undefined),
      catchError(() => {
        this.toaster.error('search.configuration.agentic.source-save-error');
        return of(undefined);
      }),
    );
  }

  updateSearchBoxConfig(config: Widget.SearchBoxConfig) {
    if (!this.savedConfig || this.currentConfig?.type !== 'config') {
      return;
    }
    const currentConfig = this.currentConfig || { ...this.savedConfig };
    this.currentConfig = { ...currentConfig, searchBox: config };
    this.isConfigModified = !this.ignoreChanges && !isSameConfigurations(this.currentConfig, this.savedConfig);
    this.updateWidget();
  }
  updateGenerativeAnswerConfig(config: Widget.GenerativeAnswerConfig) {
    if (!this.savedConfig || this.currentConfig?.type !== 'config') {
      return;
    }
    const currentConfig = this.currentConfig || { ...this.savedConfig };
    this.currentConfig = { ...currentConfig, generativeAnswer: config };
    this.isConfigModified = !this.ignoreChanges && !isSameConfigurations(this.currentConfig, this.savedConfig);
    this.useGenerativeAnswer = config.generateAnswer;
    this.updateWidget();
  }
  updateResultDisplayConfig(config: Widget.ResultDisplayConfig) {
    if (!this.savedConfig || this.currentConfig?.type !== 'config') {
      return;
    }
    const currentConfig = this.currentConfig || { ...this.savedConfig };
    this.currentConfig = { ...currentConfig, resultDisplay: config };
    this.isConfigModified = !this.ignoreChanges && !isSameConfigurations(this.currentConfig, this.savedConfig);
    this.updateWidget();
  }
  updateRoutingConfig(config: Widget.RoutingConfig) {
    if (!this.savedConfig || this.currentConfig?.type !== 'config') {
      return;
    }
    const currentConfig = this.currentConfig || { ...this.savedConfig };
    const cleanConfig: Widget.RoutingConfig = config.routing
      ? {
          ...config,
          routing: { ...config.routing, rules: config.routing.rules.filter((rule) => !!rule.search_config) },
        }
      : config;
    this.currentConfig = { ...currentConfig, routing: cleanConfig };
    this.isConfigModified =
      !this.ignoreNextRoutingRefresh && !isSameConfigurations(this.currentConfig, this.savedConfig);
    this.updateWidget();
  }

  updateAgenticConfigHeight() {
    this.agenticConfigItem?.updateContentHeight();
  }
  updateSearchBoxHeight() {
    this.searchBoxItem?.updateContentHeight();
  }
  updateGenerativeAnswerHeight() {
    this.generativeAnswerItem?.updateContentHeight();
  }
  updateResultsHeight() {
    this.resultsItem?.updateContentHeight();
  }
  updateRoutingHeight() {
    this.routingItem?.updateContentHeight();
  }

  updateHeight() {
    this.updateAgenticConfigHeight();
    this.updateSearchBoxHeight();
    this.updateGenerativeAnswerHeight();
    this.updateResultsHeight();
    this.updateRoutingHeight();
  }

  scrollOnTop() {
    this.configurationContainer?.nativeElement.scrollTo(0, { scrollingBehaviour: 'smooth' });
  }

  showLastRequest() {
    if (this.lastQuery) {
      this.modalService.openModal(
        SearchRequestModalComponent,
        new ModalConfig({ dismissable: true, data: this.lastQuery }),
      );
    }
  }

  private updateWidget() {
    if (this.currentConfig) {
      this.lastQuery = undefined;
      this.configUpdate.emit(this.currentConfig);
    }
  }

  updateJsonConfig(jsonConfig: string) {
    this.currentJsonConfig = jsonConfig;
    this.isConfigModified = this.currentConfig !== this.originalJsonConfig;
  }

  switchToJsonMode() {
    this.modalService
      .openConfirm({
        title: this.translate.instant('search.configuration.action.switch-mode-confirm'),
        isDestructive: true,
      })
      .onClose.pipe(filter((confirm) => !!confirm))
      .subscribe(() => {
        if (this.currentConfig?.type === 'config') {
          const isAsk =
            this.currentConfig.searchMode === 'agentic' || !!this.currentConfig.generativeAnswer?.generateAnswer;
          try {
            const config: SearchConfig = isAsk
              ? {
                  kind: 'ask',
                  config:
                    this.currentConfig.searchMode === 'agentic'
                      ? getAgenticChatOptions(this.currentConfig)
                      : getChatOptions(this.currentConfig as Widget.StandardSearchConfiguration),
                }
              : {
                  kind: 'find',
                  config: getFindOptions(this.currentConfig as Widget.StandardSearchConfiguration),
                };
            this.currentConfig = {
              type: 'api',
              id: this.currentConfig.id,
              value: config,
            };
            this.currentJsonConfig = JSON.stringify(config.config, null, 2);
            this.useGenerativeAnswer = isAsk;
            this.isConfigUnsupported = true;
          } catch (e) {
            this.toaster.error('search.configuration.action.switch-mode-error');
          }
        }
        this.cdr.markForCheck();
      });
  }

  updateGenerativeAnswer(useGenerativeAnswer: boolean) {
    this.useGenerativeAnswer = useGenerativeAnswer;
    console.log(this.useGenerativeAnswer);
    if (this.currentConfig?.type === 'api') {
      this.currentConfig.value.kind = useGenerativeAnswer ? 'ask' : 'find';
    }
    this.isConfigModified = true;
    this.cdr.markForCheck();
  }
}
