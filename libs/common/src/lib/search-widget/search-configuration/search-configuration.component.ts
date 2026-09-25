import { CommonModule } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
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
import { cloneDeep, FeaturesService, NavigationService, SDKService, STFUtils } from '@flaps/core';
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
import { catchError, EMPTY, filter, forkJoin, map, Observable, of, Subject, switchMap, take, tap } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { removeDeprecatedModels } from '../../ai-models/ai-models.utils';
import {
  DEFAULT_WIDGET_CONFIG,
  getAgenticChatOptions,
  getChatOptions,
  getFindOptions,
  findLinkedWidget,
  isSameConfigurations,
  isSameWidgetConfiguration,
  normalizeSearchConfigurationForEditor,
  normalizeWidgetConfigurationForEditor,
  SearchConfigurationSelection,
} from '../search-widget.models';
import { SearchWidgetService } from '../search-widget.service';
import { AgenticConfigurationComponent } from './agentic-configuration';
import { GenerativeAnswerFormComponent } from './generative-answer-form';
import { ResultsDisplayFormComponent } from './results-display-form';
import { SaveConfigModalComponent, SaveConfigModalReason } from './save-config-modal/save-config-modal.component';
import { SearchBoxFormComponent } from './search-box-form';
import { SearchRequestModalComponent } from './search-request-modal';
import { RoutingFormComponent } from './routing-form/routing-form.component';
import { WidgetOptionsFormComponent } from './widget-options-form';
import { ManageWidgetsModalComponent } from './manage-widgets-modal';

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
    WidgetOptionsFormComponent,
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
  private navigationService = inject(NavigationService);

  private unsubscribeAll = new Subject<void>();
  private configSelection = new Subject<SearchConfigurationSelection>();

  @Input({ transform: booleanAttribute }) displayWidgetButtonLine = false;
  @Input({ transform: booleanAttribute }) onlySupportedConfigs = false;
  @Input() configurationContainer?: ElementRef;
  @Input() mainTitle = '';
  @Input() bottomSectionStyle = '';
  /**
   * When set, the configuration linked to this widget slug is selected on initial load instead of the
   * last-selected configuration — used so deep links to a widget's old `/widgets/:slug` admin URL (now
   * redirected to `/search/:slug`) still land on the right configuration.
   */
  @Input() initialWidgetSlug?: string;

  @Output() configUpdate = new EventEmitter<Widget.AnySearchConfiguration>();
  @Output() widgetConfigUpdate = new EventEmitter<Widget.WidgetConfiguration>();
  @Output() getEmbedCode = new EventEmitter<string>();

  @ViewChild('widgetOptions', { read: AccordionItemComponent }) widgetOptionsItem?: AccordionItemComponent;
  @ViewChild(WidgetOptionsFormComponent) widgetOptionsFormComponent?: WidgetOptionsFormComponent;
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
  inArag = this.navigationService.inArag();
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

  isConfigUnsupported = false;
  canModifyConfig = this.features.isKbAdmin;

  searchMode = signal<'agentic' | 'simple-rag' | 'search'>('simple-rag');
  currentKbSource = signal<{ id: string; label: string } | null>(null);
  agenticWidgetConfigNames = signal<string[]>([]);
  agenticSourcesValid = signal(true);
  agenticSourcesRequiredWarning = signal(false);
  pendingAgenticSource = signal<{ title: string; description: string } | undefined>(undefined);

  /**
   * The widget deployment (appearance settings + embed slug) already linked to the currently selected
   * search configuration, if this configuration has ever been deployed as a widget. `undefined` means
   * the selected configuration has not been deployed yet. A configuration is treated as 1:1 with its
   * widget deployment from the UI's perspective, even though the underlying storage still allows a
   * widget to reference any search config by id.
   */
  linkedWidget = signal<Widget.Widget | undefined>(undefined);

  /**
   * Appearance/deployment options shown in the "Widget options" accordion section. Seeded from the
   * linked widget's saved appearance when one exists, otherwise defaults — so the section is always
   * usable, even before the current configuration has ever been deployed as a widget.
   */
  widgetOptionsConfig = computed<Widget.WidgetConfiguration>(
    () => this.linkedWidget()?.widgetConfig ?? DEFAULT_WIDGET_CONFIG,
  );

  /**
   * Live, possibly-unsaved value of the "Widget options" form, kept in sync via `updateWidgetOptionsConfig`.
   * Used on save/overwrite to decide whether to also persist widget deployment data alongside the search
   * configuration (see `_persistWidgetDeployment`).
   */
  private currentWidgetOptions = signal<Widget.WidgetConfiguration>(DEFAULT_WIDGET_CONFIG);

  get isNucliaConfig() {
    return this.savedConfig?.id.startsWith('nuclia-');
  }

  /**
   * A configuration counts as modified if either the search-behavior config (retrieval/generative/
   * results/routing) or the "Widget options" (appearance/deployment) form has unsaved changes — Save
   * must be enabled for either, not just the former.
   */
  get isConfigModified(): boolean {
    if (this.currentConfig?.type === 'api' && this.savedConfig?.type === 'api') {
      const jsonModified = this.currentJsonConfig !== this.originalJsonConfig;
      const requestKindModified = this.currentConfig.value.kind !== this.savedConfig.value.kind;
      return jsonModified || requestKindModified || this.areWidgetOptionsModified();
    }
    const searchConfigModified =
      !!this.currentConfig && !!this.savedConfig && !isSameConfigurations(this.currentConfig, this.savedConfig);
    return searchConfigModified || this.areWidgetOptionsModified();
  }

  private areWidgetOptionsModified(): boolean {
    return !isSameWidgetConfiguration(this.currentWidgetOptions(), this.widgetOptionsConfig());
  }

  get isEmbedCodeDisabled(): boolean {
    return !this.savedConfig || this.savedConfig.type !== 'config' || (!this.isNucliaConfig && this.isConfigModified);
  }

  ngOnInit() {
    this.configSelection
      .pipe(
        switchMap((selection) =>
          this.loadSelectedConfiguration(selection).pipe(
            catchError(() => {
              this.toaster.error('search.configuration.loading-error');
              return EMPTY;
            }),
          ),
        ),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe(({ savedConfig, linkedWidget }) => this.applySelectedConfiguration(savedConfig, linkedWidget));

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
      this.searchWidgetService.widgetList.pipe(take(1)),
    ]).pipe(
      tap(([kb, savedConfigs, widgets]) => {
        const standardConfigOption = new OptionModel({
          id: 'nuclia-standard',
          value: 'nuclia-standard',
          label: this.translate.instant('search.configuration.options.nuclia-standard'),
        });

        const configurations: OptionType[] = [standardConfigOption];
        if (savedConfigs.length > 0) {
          configurations.push(new OptionSeparator());
        }
        const options = configurations.concat(
          savedConfigs.map(
            (item) =>
              new OptionModel({
                id: item.id,
                value: item.id,
                label: item.id,
              }),
          ),
        );

        // Deep-link support: a widget slug passed in (e.g. from the old /widgets/:slug admin URL,
        // now redirected here) selects that widget's linked configuration instead of the last-selected
        // one, if it can be resolved to a configuration that still exists.
        const initialWidget = this.initialWidgetSlug
          ? widgets.find((widget) => widget.slug === this.initialWidgetSlug)
          : undefined;
        const initialConfigFromWidget = initialWidget?.searchConfigId
          ? savedConfigs.find((c) => c.id === initialWidget.searchConfigId)
          : undefined;
        const savedConfig =
          initialConfigFromWidget || this.searchWidgetService.getSelectedSearchConfig(kb.id, savedConfigs);
        if (initialConfigFromWidget) {
          this.searchWidgetService.saveSelectedSearchConfig(kb.id, initialConfigFromWidget.id);
        }
        // Set the control before publishing the options: pa-select reads its current control value
        // when the options input changes, so this initializes the visible selection without firing
        // the user-selection pipeline a second time.
        this.selectedConfig.patchValue(savedConfig.id, { emitEvent: false });
        this.configurations = options;
        this.applySelectedConfiguration(savedConfig, initialWidget || findLinkedWidget(widgets, savedConfig.id));
        this.agenticWidgetConfigNames.set(
          savedConfigs
            .filter((c) => c.type === 'config' && (c as Widget.TypedSearchConfiguration).searchMode === 'agentic')
            .map((c) => c.id),
        );
        this.cdr.markForCheck();
      }),
    );
  }

  /**
   * Looks up whether the given search configuration id already has a widget deployment (appearance
   * settings + embed slug) attached, and updates `linkedWidget` accordingly. Called whenever the
   * selected configuration changes, so the header actions (Get embed code, Widget options) can react
   * to whether the current configuration has been deployed yet.
   */
  private refreshLinkedWidget(configId: string) {
    this.searchWidgetService.widgetList.pipe(take(1), takeUntil(this.unsubscribeAll)).subscribe((widgets) => {
      this.applyLinkedWidget(widgets.find((widget) => widget.searchConfigId === configId));
      this.cdr.markForCheck();
    });
  }

  private applyLinkedWidget(widget: Widget.Widget | undefined) {
    const normalizedWidget = widget
      ? {
          ...cloneDeep(widget),
          widgetConfig: normalizeWidgetConfigurationForEditor(widget.widgetConfig ?? DEFAULT_WIDGET_CONFIG),
        }
      : undefined;
    this.linkedWidget.set(normalizedWidget);
    const widgetOptions =
      normalizedWidget?.widgetConfig ?? normalizeWidgetConfigurationForEditor(DEFAULT_WIDGET_CONFIG);
    this.currentWidgetOptions.set(cloneDeep(widgetOptions));
    this.widgetConfigUpdate.emit(cloneDeep(widgetOptions));
    if (this.widgetOptionsFormComponent) {
      this.widgetOptionsFormComponent.config = widgetOptions;
    }
  }

  private applySelectedConfiguration(config: Widget.AnySearchConfiguration, linkedWidget: Widget.Widget | undefined) {
    const normalizedConfig = normalizeSearchConfigurationForEditor(
      config,
      this.generativeProviders,
      this.generativeModelFromSettings,
    );
    this.savedConfig = cloneDeep(normalizedConfig);
    this.currentConfig = cloneDeep(normalizedConfig);
    this.selectedConfig.patchValue(normalizedConfig.id, { emitEvent: false });
    this.configurations = [...this.configurations];
    this.applyLinkedWidget(linkedWidget);
    this._syncModeSignals(normalizedConfig);
    if (normalizedConfig.type === 'api') {
      this.isConfigUnsupported = true;
      this.originalJsonConfig = JSON.stringify(normalizedConfig.value.config, null, 2);
      this.currentJsonConfig = this.originalJsonConfig;
      this.useGenerativeAnswer = normalizedConfig.value.kind === 'ask';
    } else {
      this.isConfigUnsupported = false;
      this.originalJsonConfig = '';
      this.currentJsonConfig = '';
      this.useGenerativeAnswer = !!normalizedConfig.generativeAnswer?.generateAnswer;
    }
    this.updateWidget();
    this.cdr.markForCheck();
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
    this.configSelection.next({ configId });
  }

  private loadSelectedConfiguration(selection: SearchConfigurationSelection) {
    return forkJoin([
      this.onlySupportedConfigs
        ? this.searchWidgetService.supportedSearchConfigurations.pipe(take(1))
        : this.searchWidgetService.searchConfigurations.pipe(take(1)),
      this.searchWidgetService.widgetList.pipe(take(1)),
      this.sdk.currentKb.pipe(take(1)),
    ]).pipe(
      switchMap(([configs, widgets, kb]) => {
        // getSelectedSearchConfig reads the selected id from localStorage, so persist the requested id first.
        this.searchWidgetService.saveSelectedSearchConfig(kb.id, selection.configId);
        const savedConfig = this.searchWidgetService.getSelectedSearchConfig(kb.id, configs);
        return this._hydrateAgenticConfig(kb, savedConfig).pipe(
          map((hydrated) => ({
            savedConfig: hydrated,
            linkedWidget: findLinkedWidget(widgets, hydrated.id, selection.widgetSlug),
          })),
        );
      }),
    );
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
    // pa-radio-group emits valueChange when its bound value is updated programmatically. If the
    // loaded draft already has this mode, this is hydration rather than a user change.
    if (this.currentConfig.searchMode === mode) return;
    this.searchMode.set(mode);
    const currentConfig = this.currentConfig;
    // Request kind is purely a function of mode: 'search' is always 'find', 'simple-rag' always 'ask'
    const generativeAnswer = {
      ...(currentConfig.generativeAnswer ?? DEFAULT_GENERATIVE_ANSWER_CONFIG),
      generateAnswer: mode === 'simple-rag',
    };
    const nextConfig: Widget.TypedSearchConfiguration = {
      ...currentConfig,
      searchMode: mode,
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
      delete nextConfig.agentic;
    }
    this.currentConfig = nextConfig;
    if (mode !== 'agentic') {
      this.useGenerativeAnswer = generativeAnswer.generateAnswer;
    }
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
    this.updateWidget();
    this.updateAgenticConfigHeight();
  }

  /**
   * "Get embed code" — deploys the current saved configuration as a widget the first time it's
   * clicked (persisting the current "Widget options" appearance settings), then emits the resulting
   * widget slug so the host page (which owns the live preview / snippet generation) can open the
   * embed dialog. Subsequent clicks just re-emit the already-linked widget's slug.
   */
  triggerGetEmbedCode() {
    if (this.isEmbedCodeDisabled || !this.savedConfig) {
      return;
    }
    if (this.isNucliaConfig) {
      this.modalService
        .openModal(SaveConfigModalComponent, new ModalConfig<SaveConfigModalReason>({ data: 'default-embed' }))
        .onClose.pipe(
          filter((configName): configName is string => !!configName),
          switchMap((configName) =>
            this._saveConfig(configName, true).pipe(
              filter((success) => !!success),
              switchMap(() =>
                this.searchWidgetService
                  .createWidget(configName, this.currentWidgetOptions(), configName)
                  .pipe(map((widgetSlug) => ({ widgetSlug }))),
              ),
            ),
          ),
          switchMap(({ widgetSlug }) => this.setConfigurations().pipe(map(() => widgetSlug))),
        )
        .subscribe((widgetSlug) => this.getEmbedCode.emit(widgetSlug));
      return;
    }
    const configId = this.savedConfig.id;
    const linkedWidget = this.linkedWidget();
    if (linkedWidget) {
      this.getEmbedCode.emit(linkedWidget.slug);
      return;
    }
    this.searchWidgetService.createWidget(configId, this.currentWidgetOptions(), configId).subscribe((widgetSlug) => {
      this.refreshLinkedWidget(configId);
      this.getEmbedCode.emit(widgetSlug);
    });
  }

  /**
   * Opens the compact "Manage widgets" table (rename/duplicate/delete any deployed widget). Selecting
   * a row loads that widget's search configuration into the panel, same as picking it from the
   * "Saved configuration" selector above.
   */
  manageWidgets() {
    this.modalService
      .openModal(ManageWidgetsModalComponent, new ModalConfig({ dismissable: true }))
      .onClose.subscribe((selection?: SearchConfigurationSelection) => {
        if (selection) {
          this.selectedConfig.patchValue(selection.configId, { emitEvent: false });
          this.configSelection.next(selection);
        } else if (this.savedConfig) {
          // Modal actions can add, rename, duplicate, or delete whole configuration/embed items.
          // Refresh the same source used by the selector so both surfaces remain identical.
          this.setConfigurations().subscribe();
        }
      });
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
        // Keep currentConfig directly in sync with the freshly-reset savedConfig instead of relying on
        // each child form (search box, generative answer, results, routing) to notice its `[config]`
        // input changed and re-emit — that cascade is fragile and previously left currentConfig stale,
        // causing isConfigModified to flip back to true on the very next recompute.
        this.currentConfig = { ...this.savedConfig };
        this._syncModeSignals(this.savedConfig);
      } else {
        this.currentJsonConfig = this.originalJsonConfig;
        this.useGenerativeAnswer = this.savedConfig.value.kind === 'ask';
      }
      // Also revert the "Widget options" form back to the last saved appearance — the search-config
      // reset above doesn't touch it, and since widgetOptionsConfig() is a computed signal that only
      // changes when linkedWidget() changes, the form input setter wouldn't otherwise re-fire.
      const savedWidgetOptions = this.widgetOptionsConfig();
      this.currentWidgetOptions.set(cloneDeep(savedWidgetOptions));
      this.widgetConfigUpdate.emit(cloneDeep(savedWidgetOptions));
      if (this.widgetOptionsFormComponent) {
        this.widgetOptionsFormComponent.config = savedWidgetOptions;
      }
    }
  }

  saveConfig() {
    if (this.validateConfigBeforeSave()) {
      this.modalService
        .openModal(
          SaveConfigModalComponent,
          this.isNucliaConfig
            ? new ModalConfig<SaveConfigModalReason>({ data: 'default-readonly' })
            : undefined,
        )
        .onClose.pipe(
          filter((confirm) => !!confirm),
          switchMap((configName) => this._saveConfig(configName, true)),
          filter((success) => !!success),
          switchMap(() => this.setConfigurations()),
        )
        .subscribe();
    }
  }

  overwriteConfig() {
    if (this.validateConfigBeforeSave() && this.currentConfig) {
      const configName = this.currentConfig.id;
      this.modalService
        .openConfirm({
          title: this.translate.instant('search.configuration.overwrite-config-confirm.title', { configName }),
          description: 'search.configuration.overwrite-config-confirm.description',
          confirmLabel: 'search.configuration.action.overwrite',
        })
        .onClose.pipe(
          filter((confirm) => !!confirm),
          // Refresh from the server after overwriting, same as `saveConfig()`'s "save as new" path —
          // otherwise `savedConfig` stays stale (pre-overwrite) while `isConfigModified` is forced false,
          // so the very next cascaded form emission compares against outdated saved state and flips the
          // banner back on.
          switchMap(() => this._saveConfig(configName, false)),
          filter((success) => !!success),
          switchMap(() => this.setConfigurations()),
        )
        .subscribe();
    }
  }

  private validateConfigBeforeSave(): boolean {
    if (!this.isConfigModified && !this.isNucliaConfig) {
      return false;
    }
    if (this.searchMode() === 'agentic' && !this.agenticSourcesValid()) {
      this.toaster.warning('search.configuration.agentic.sources-required');
      return false;
    }
    return true;
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
          switchMap(() => this.searchWidgetService.deleteWidgetsForSearchConfig(config.id)),
          switchMap(() => this.setConfigurations()),
        )
        .subscribe();
    }
  }

  private _saveConfig(configName: string, isNewConfig: boolean) {
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
              switchMap(() => this._persistWidgetDeployment(configName, isNewConfig)),
              map(() => {
                if (this.isConfigUnsupported) {
                  this.updateWidget();
                }
                this.originalJsonConfig =
                  this.currentConfig?.type === 'api' ? JSON.stringify(this.currentConfig.value.config, null, 2) : '';
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
   * Persists the current "Widget options" form value alongside the search configuration being saved,
   * when relevant:
   * - Overwrite (same config id, already deployed): update the existing widget's appearance in place.
   * - Save as new (new config id) where the configuration being duplicated was deployed: carry the
   *   deployment forward onto the new configuration too, so "save as new" behaves like duplicating the
   *   whole item (search config + widget appearance), not just the search settings.
   * - No linked widget: this configuration has never been deployed — nothing to persist here. Deploying
   *   for the first time happens via the "Get embed code" action instead.
   */
  private _persistWidgetDeployment(configName: string, isNewConfig: boolean): Observable<unknown> {
    const linkedWidget = this.linkedWidget();
    const widgetOptions = this.currentWidgetOptions();
    if (!linkedWidget) {
      return of(undefined);
    }
    if (isNewConfig) {
      return this.searchWidgetService
        .createWidget(configName, widgetOptions, configName)
        .pipe(tap(() => this.refreshLinkedWidget(configName)));
    }
    return this.searchWidgetService
      .updateWidget(linkedWidget.slug, widgetOptions, configName)
      .pipe(tap(() => this.refreshLinkedWidget(configName)));
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
    this.updateWidget();
  }
  updateGenerativeAnswerConfig(config: Widget.GenerativeAnswerConfig) {
    if (!this.savedConfig || this.currentConfig?.type !== 'config') {
      return;
    }
    const currentConfig = this.currentConfig || { ...this.savedConfig };
    this.currentConfig = normalizeSearchConfigurationForEditor(
      { ...currentConfig, generativeAnswer: config },
      this.generativeProviders,
      this.generativeModelFromSettings,
    );
    this.useGenerativeAnswer = config.generateAnswer;
    this.updateWidget();
  }
  updateResultDisplayConfig(config: Widget.ResultDisplayConfig) {
    if (!this.savedConfig || this.currentConfig?.type !== 'config') {
      return;
    }
    const currentConfig = this.currentConfig || { ...this.savedConfig };
    this.currentConfig = { ...currentConfig, resultDisplay: config };
    this.updateWidget();
  }
  updateWidgetOptionsConfig(config: Widget.WidgetConfiguration) {
    this.currentWidgetOptions.set(config);
    this.widgetConfigUpdate.emit(config);
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
    this.updateWidget();
  }

  updateAgenticConfigHeight() {
    this.agenticConfigItem?.updateContentHeight();
  }
  updateWidgetOptionsHeight() {
    this.widgetOptionsItem?.updateContentHeight();
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
    this.updateWidgetOptionsHeight();
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
    this.cdr.markForCheck();
  }
}
