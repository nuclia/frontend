import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NavigationService, SDKService } from '@flaps/core';
import { ExpandableTextareaComponent } from '@nuclia/sistema';
import {
  AgenticConfig,
  AgenticSmartAgentMode,
  AgenticSources,
  GenerativeProviders,
  LearningConfigurations,
  SearchConfigs,
  Widget,
} from '@nuclia/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  PaButtonModule,
  PaDropdownModule,
  PaTextFieldModule,
  PaTogglesModule,
  OptionModel,
} from '@guillotinaweb/pastanaga-angular';
import { catchError, forkJoin, map, of, switchMap, take } from 'rxjs';
import { ModelSelectorComponent } from '../../../ai-models';

@Component({
  selector: 'stf-agentic-configuration',
  imports: [
    ExpandableTextareaComponent,
    FormsModule,
    ModelSelectorComponent,
    PaButtonModule,
    PaDropdownModule,
    PaTextFieldModule,
    PaTogglesModule,
    RouterLink,
    TranslateModule,
  ],
  templateUrl: './agentic-configuration.component.html',
  styleUrl: './agentic-configuration.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgenticConfigurationComponent {
  private sdk = inject(SDKService);
  private destroyRef = inject(DestroyRef);
  private translate = inject(TranslateService);
  private navigationService = inject(NavigationService);

  readonly config = input<Widget.TypedSearchConfiguration | undefined>(undefined);
  readonly excludeSearchConfigNames = input<string[]>([]);
  readonly learningConfigurations = input<LearningConfigurations>({});
  readonly generativeProviders = input<GenerativeProviders>({});

  readonly configChanged = output<Partial<Widget.TypedSearchConfiguration>>();
  readonly heightChanged = output<void>();
  readonly sourcesValidChanged = output<boolean>();
  readonly sourcesRequiredWarningChanged = output<boolean>();
  readonly pendingSourceChanged = output<{ title: string; description: string } | undefined>();

  readonly connectionTypeLabels: Record<string, string> = {
    nucliadb: 'Knowledge Box',
    mcp: 'MCP',
    perplexity: 'Perplexity Search',
    google: 'Gemini Google Search',
    sync: 'Synchronization',
    unknown: 'Unknown',
  };

  // Ask-level parameters (sent alongside the agentic_config_id on ask requests)
  agenticSearchConfiguration = signal<string>('');
  private _allAskSearchConfigs = signal<string[]>([]);

  // Agentic pipeline config draft (smart_agent + rephrase + summarize)
  availableSources = signal<Array<{ id: string; type: string; description?: string }>>([]);
  selectedSourceIds = signal<string[]>([]);
  mode = signal<AgenticSmartAgentMode>('reactive');
  extraPrompt = signal<string>('');
  useRephrasePrompt = signal<boolean>(false);
  rephrasePrompt = signal<string>('');
  rephraseModel = signal<string>('');
  useSummarizePrompt = signal<boolean>(false);
  summarizeSystemPrompt = signal<string>('');
  summarizeModel = signal<string>('');
  useSpecificModels = signal<boolean>(false);
  executorModel = signal<string>('');
  plannerModel = signal<string>('');

  // Draft for the KB source created on save when the KB has no agentic sources yet (see `hasAvailableSources`).
  newSourceTitle = signal<string>('');
  newSourceDescription = signal<string>('');

  readonly displayedExecutorModel = computed(() => this.executorModel() || this.defaultGenerativeModel());
  readonly displayedPlannerModel = computed(() => this.plannerModel() || this.defaultGenerativeModel());
  readonly displayedRephraseModel = computed(() => this.rephraseModel() || this.defaultGenerativeModel());
  readonly displayedSummarizeModel = computed(() => this.summarizeModel() || this.defaultGenerativeModel());

  readonly askSearchConfigOptions = computed(() => [
    new OptionModel({ id: '', value: '', label: '–' }),
    ...this._allAskSearchConfigs()
      .filter((name) => !this.excludeSearchConfigNames().includes(name))
      .map((name) => new OptionModel({ id: name, value: name, label: name })),
  ]);

  /** KB's default generative model, used to preselect model dropdowns when no explicit choice was made. */
  readonly defaultGenerativeModel = computed(() => this.learningConfigurations()['generative_model']?.default || '');

  readonly modeOptions = [
    new OptionModel({
      id: 'reactive',
      value: 'reactive',
      label: this.translate.instant('search.configuration.agentic.mode.reactive'),
    }),
    new OptionModel({
      id: 'plan_execute',
      value: 'plan_execute',
      label: this.translate.instant('search.configuration.agentic.mode.plan-execute'),
    }),
  ];

  readonly canAddSource = computed(() => this.selectedSourceIds().length < this.availableSources().length);

  readonly hasAvailableSources = computed(() => this.availableSources().length > 0);

  readonly hasNucliaDbSource = computed(() => {
    if (!this.hasAvailableSources()) return true; // in this case we create a nucliadb source for user from title&description fields
    const sources = this.availableSources();
    return this.selectedSourceIds().some((id) => sources.find((source) => source.id === id)?.type === 'nucliadb');
  });

  readonly hasSelectedSource = computed(() => this.selectedSourceIds().some((id) => !!id));
  readonly isNewSourceValid = computed(() => !!this.newSourceTitle().trim());
  /** Save is only meaningful once the agent has at least one source: an existing one selected, or a new KB source ready to be created. */
  readonly sourcesValid = computed(() =>
    this.hasAvailableSources() ? this.hasSelectedSource() : this.isNewSourceValid(),
  );
  /** Only relevant when the KB already has sources to pick from: nudges the user to select at least one. */
  readonly showSourcesRequiredWarning = computed(() => this.hasAvailableSources() && !this.hasSelectedSource());

  readonly connectSourcesUrl = toSignal(this.navigationService.kbUrl.pipe(map((kbUrl) => `${kbUrl}/sync/connect`)), {
    initialValue: '',
  });

  constructor() {
    effect(() => {
      const cfg = this.config();
      this.agenticSearchConfiguration.set(cfg?.agentic?.searchConfigId || '');
      this._loadAgenticConfigDraft(cfg?.agentic?.config);
    });

    effect(() => this.sourcesValidChanged.emit(this.sourcesValid()));
    effect(() => this.sourcesRequiredWarningChanged.emit(this.showSourcesRequiredWarning()));

    effect(() => {
      this.pendingSourceChanged.emit(
        this.hasAvailableSources()
          ? undefined
          : { title: this.newSourceTitle(), description: this.newSourceDescription() },
      );
    });

    this.sdk.currentKb
      .pipe(
        take(1),
        switchMap((kb) =>
          forkJoin([
            kb.getSearchConfigs().pipe(catchError(() => of({} as SearchConfigs))),
            kb.listAgenticSources().pipe(catchError(() => of({} as AgenticSources))),
          ]).pipe(map(([configs, sources]) => ({ kb, configs, sources }))),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ kb, configs, sources }) => {
        this._allAskSearchConfigs.set(
          Object.entries(configs)
            .filter(([, cfg]) => cfg.kind === 'ask' && !cfg.config.agentic_config_id)
            .map(([name]) => name),
        );
        this.availableSources.set(
          Object.entries(sources).map(([id, source]) => ({ id, type: source.type, description: source.description })),
        );
        this.newSourceTitle.set(kb.title || '');
        this.newSourceDescription.set(kb.description || '');
        this.heightChanged.emit();
      });
  }

  private _loadAgenticConfigDraft(draft: AgenticConfig | undefined) {
    this.selectedSourceIds.set(draft?.smart_agent?.sources ?? []);
    this.mode.set(draft?.smart_agent?.mode ?? 'reactive');
    this.extraPrompt.set(draft?.smart_agent?.extra_prompt ?? '');
    this.executorModel.set(draft?.smart_agent?.models?.executor ?? '');
    this.plannerModel.set(draft?.smart_agent?.models?.planner ?? '');

    this.useRephrasePrompt.set(!!draft?.rephrase?.prompt);
    this.rephrasePrompt.set(draft?.rephrase?.prompt ?? '');
    this.rephraseModel.set(draft?.rephrase?.model ?? '');

    this.useSummarizePrompt.set(!!draft?.summarize?.system_prompt);
    this.summarizeSystemPrompt.set(draft?.summarize?.system_prompt ?? '');
    this.summarizeModel.set(draft?.summarize?.model ?? '');

    this.useSpecificModels.set(
      !!draft?.smart_agent?.models?.executor ||
        !!draft?.smart_agent?.models?.planner ||
        !!draft?.rephrase?.model ||
        !!draft?.summarize?.model,
    );
  }

  private _emitAgenticConfig() {
    const useModels = this.useSpecificModels();
    const mode = this.mode();
    const agenticConfig: AgenticConfig = {
      smart_agent: {
        mode,
        extra_prompt: this.extraPrompt() || undefined,
        sources: this.selectedSourceIds().filter((id) => !!id),
        history: true,
        ...(useModels
          ? {
              models: {
                executor: this.displayedExecutorModel() || undefined,
                planner: mode === 'plan_execute' ? this.displayedPlannerModel() || undefined : undefined,
              },
            }
          : {}),
      },
      rephrase: {
        prompt: this.useRephrasePrompt() ? this.rephrasePrompt() || undefined : undefined,
        history: true,
        ...(useModels && this.displayedRephraseModel() ? { model: this.displayedRephraseModel() } : {}),
      },
      summarize: {
        system_prompt: this.useSummarizePrompt() ? this.summarizeSystemPrompt() || undefined : undefined,
        conversational: true,
        history: true,
        ...(useModels && this.displayedSummarizeModel() ? { model: this.displayedSummarizeModel() } : {}),
      },
    };
    this.configChanged.emit({ agentic: { config: agenticConfig } });
  }

  updateSearchConfiguration(name: string) {
    this.agenticSearchConfiguration.set(name);
    this.configChanged.emit({ agentic: { searchConfigId: name || undefined } });
  }

  updateNewSourceTitle(val: string) {
    this.newSourceTitle.set(val);
  }

  updateNewSourceDescription(val: string) {
    this.newSourceDescription.set(val);
  }

  /** Called by the parent once it has actually created the pending KB source on save, so this draft doesn't get recreated on the next save. */
  applyCreatedSource(id: string, description: string) {
    this.availableSources.update((list) => [...list, { id, type: 'nucliadb', description }]);
    this.selectedSourceIds.set([id]);
    this.newSourceTitle.set('');
    this.newSourceDescription.set('');
    this._emitAgenticConfig();
  }

  addSourceRow() {
    if (!this.canAddSource()) return;
    this.selectedSourceIds.update((ids) => [...ids, '']);
    this.heightChanged.emit();
  }

  removeSourceRow(index: number) {
    this.selectedSourceIds.update((ids) => ids.filter((_, i) => i !== index));
    this._emitAgenticConfig();
    this.heightChanged.emit();
  }

  updateSourceAt(index: number, id: string) {
    this.selectedSourceIds.update((ids) => ids.map((value, i) => (i === index ? id : value)));
    this._emitAgenticConfig();
  }

  sourceOptionsForRow(currentId: string) {
    const selected = this.selectedSourceIds();
    return this.availableSources()
      .filter((source) => source.id === currentId || !selected.includes(source.id))
      .map(
        (source) =>
          new OptionModel({
            id: source.id,
            value: source.id,
            label: source.id,
            help: this.connectionTypeLabels[source.type] ?? source.type,
          }),
      );
  }

  updateMode(mode: AgenticSmartAgentMode) {
    this.mode.set(mode);
    if (mode !== 'plan_execute') {
      this.plannerModel.set('');
    }
    this._emitAgenticConfig();
  }

  updateExtraPrompt(val: string) {
    this.extraPrompt.set(val);
    this._emitAgenticConfig();
  }

  toggleUseRephrasePrompt(val: boolean) {
    this.useRephrasePrompt.set(val);
    this._emitAgenticConfig();
    this.heightChanged.emit();
  }

  updateRephrasePrompt(val: string) {
    this.rephrasePrompt.set(val);
    this._emitAgenticConfig();
  }

  toggleUseSummarizePrompt(val: boolean) {
    this.useSummarizePrompt.set(val);
    this._emitAgenticConfig();
    this.heightChanged.emit();
  }

  updateSummarizeSystemPrompt(val: string) {
    this.summarizeSystemPrompt.set(val);
    this._emitAgenticConfig();
  }

  toggleUseSpecificModels(val: boolean) {
    this.useSpecificModels.set(val);
    this._emitAgenticConfig();
    this.heightChanged.emit();
  }

  updateExecutorModel(val: string) {
    this.executorModel.set(val);
    this._emitAgenticConfig();
  }

  updatePlannerModel(val: string) {
    this.plannerModel.set(val);
    this._emitAgenticConfig();
  }

  updateRephraseModel(val: string) {
    this.rephraseModel.set(val);
    this._emitAgenticConfig();
  }

  updateSummarizeModel(val: string) {
    this.summarizeModel.set(val);
    this._emitAgenticConfig();
  }
}
