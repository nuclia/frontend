import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, NgZone, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import {
  ModalConfig,
  ModalRef,
  PaButtonModule,
  PaExpanderModule,
  PaIconModule,
  PaModalModule,
  PaTextFieldModule,
  PaTogglesModule,
  PaTooltipModule,
} from '@guillotinaweb/pastanaga-angular';
import { InfoCardComponent, NsiSkeletonComponent, SisModalService, SisProgressModule } from '@nuclia/sistema';
import {
  AdviceInput,
  AdviceResult,
  EditableParams,
  IterationHistoryEntry,
  RagAdviceService,
  suggestedParamsToSearchConfig,
} from './rag-advice.service';
import { SDKService } from '@flaps/core';
import {
  LearningConfigurationOption,
  RAGStrategy,
  RagStrategyName,
  RemiQueryCriteria,
  RemiQueryResponseItem,
} from '@nuclia/core';
import { SearchWidgetService } from '../../search-widget';
import { RemiScoreBadgeComponent } from '../remi-score-badge';
import { catchError, last, Observable, of, switchMap, take, timer } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';

type ModalState = 'input' | 'analyzing' | 'advice' | 'testing' | 'tested' | 'saving' | 'done' | 'error';
type FieldState = 'original' | 'suggested' | 'modified';

interface IterationRecord {
  round: number;
  paramsUsed: EditableParams;
  answer: string;
  remiScore: number | null;
  remiAnswerRelevance: number | null;
  remiContentRelevance: number | null;
  remiGroundedness: number | null;
  noContext: boolean;
  remiPending: boolean;
}

/**
 * RAG exploration modal — opened via SisModalService.openModal(RagAdviceModalComponent, new ModalConfig({ data: adviceInput })).
 * The AdviceInput is passed through ModalRef config data.
 */
@Component({
  selector: 'app-rag-advice-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    PaButtonModule,
    PaIconModule,
    PaModalModule,
    PaTextFieldModule,
    PaExpanderModule,
    PaTogglesModule,
    PaTooltipModule,
    InfoCardComponent,
    NsiSkeletonComponent,
    SisProgressModule,
    RemiScoreBadgeComponent,
  ],
  templateUrl: './rag-advice.component.html',
  styleUrl: './rag-advice.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RagAdviceModalComponent {
  private adviceService = inject(RagAdviceService);
  private sdk = inject(SDKService);
  private searchWidgetService = inject(SearchWidgetService);
  private ngZone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);

  readonly state = signal<ModalState>('input');
  readonly userExpectation = signal('');
  readonly advice = signal<AdviceResult | null>(null);
  readonly editableParams = signal<EditableParams | null>(null);
  readonly iterations = signal<IterationRecord[]>([]);
  readonly configName = signal('');
  readonly savingConfig = signal(false);
  readonly errorMessage = signal('');

  /** Models loaded from the KB's learning schema for the generative_model field. */
  readonly availableModels = signal<LearningConfigurationOption[]>([]);

  /** Original (baseline) params from the activity log entry — set once on first advice call. */
  readonly originalParams = signal<EditableParams | null>(null);

  /**
   * Cumulative map of all fields that have been explicitly suggested by the LLM across all rounds.
   * Used by fieldStates to correctly mark fields as 'suggested' even when later rounds
   * don't re-mention them (they were carried forward from a prior suggestion).
   */
  readonly accumulatedSuggestions = signal<Partial<EditableParams>>({});

  readonly latestIteration = computed(() => {
    const arr = this.iterations();
    return arr.length > 0 ? arr[arr.length - 1] : null;
  });

  readonly previousIterations = computed(() => {
    const arr = this.iterations();
    return arr.length > 1 ? arr.slice(0, -1) : [];
  });

  readonly hasMinScoreParams = computed(() => {
    const p = this.editableParams();
    return p !== null && (p.minScoreSemantic !== null || p.minScoreBm25 !== null);
  });

  /**
   * Per-field state: 'original' (unchanged from baseline), 'suggested' (matches any accumulated
   * AI suggestion across all rounds), or 'modified' (user changed it away from suggestions).
   * Only meaningful when originalParams is non-null.
   */
  readonly fieldStates = computed<Record<keyof EditableParams, FieldState>>(() => {
    const defaultAll: Record<keyof EditableParams, FieldState> = {
      minScoreSemantic: 'original',
      minScoreBm25: 'original',
      topK: 'original',
      neighbouringParagraphs: 'original',
      fullResource: 'original',
      metadatas: 'original',
      graph: 'original',
      rephrase: 'original',
      model: 'original',
      systemPrompt: 'original',
    };

    const orig = this.originalParams();
    const curr = this.editableParams();
    if (!orig || !curr) return defaultAll;

    // Use the accumulated suggestion overlay — union of all rounds' suggestions
    const accSugg = this.accumulatedSuggestions();

    const fields = Object.keys(defaultAll) as (keyof EditableParams)[];
    const states = { ...defaultAll };
    for (const field of fields) {
      const currVal = curr[field];
      const origVal = orig[field];
      if (currVal === origVal) {
        states[field] = 'original';
      } else if (field in accSugg && currVal === accSugg[field as keyof EditableParams]) {
        states[field] = 'suggested';
      } else {
        states[field] = 'modified';
      }
    }
    return states;
  });

  get input(): AdviceInput | undefined {
    return this.modal.config.data;
  }

  constructor(public modal: ModalRef<AdviceInput>) {
    // Load available generative models from the KB's learning schema
    this.sdk.currentKb
      .pipe(
        take(1),
        switchMap((kb) => kb.getLearningSchema()),
        map((schema) => {
          const options: LearningConfigurationOption[] = schema['generative_model']?.options ?? [];
          // Deduplicate by value (API can return the same model multiple times)
          const seen = new Set<string>();
          return options.filter((o) => {
            if (seen.has(o.value)) return false;
            seen.add(o.value);
            return true;
          });
        }),
        catchError(() => of([])),
      )
      .subscribe((options) => this.availableModels.set(options));
  }

  generateAdvice(): void {
    const inp = this.input;
    if (!inp) return;

    // Record baseline once — never changes after modal opens
    if (this.originalParams() === null && inp.params !== undefined) {
      this.originalParams.set(this.paramsToEditable(inp.params));
    }

    this.state.set('analyzing');

    const fullInput: AdviceInput = {
      ...inp,
      userExpectation: this.userExpectation() || undefined,
    };

    this.adviceService
      .generateAdvice(fullInput)
      .pipe(
        catchError((err) => {
          this.errorMessage.set(err?.message || 'Failed to generate suggestions');
          this.state.set('error');
          return of(null);
        }),
      )
      .subscribe((result) => {
        if (result) {
          this.advice.set(result);
          this.editableParams.set(this.initEditableParams(result));
          this.state.set('advice');
        }
      });
  }

  testSettings(): void {
    const inp = this.input;
    const params = this.editableParams();
    if (!inp || !params) return;

    const iterationIndex = this.iterations().length;

    const ragStrategies: RAGStrategy[] = [];
    if (params.neighbouringParagraphs && !params.fullResource) {
      ragStrategies.push({ name: RagStrategyName.NEIGHBOURING_PARAGRAPHS, before: 1, after: 1 });
    }
    if (params.fullResource) {
      ragStrategies.push({ name: RagStrategyName.FULL_RESOURCE });
    }
    if (params.metadatas) {
      ragStrategies.push({
        name: RagStrategyName.METADATAS,
        types: ['origin', 'classification_labels', 'ners', 'extra_metadata'] as any,
      });
    }
    if (params.graph) {
      ragStrategies.push({ name: RagStrategyName.GRAPH, hops: 1, top_k: 10 });
    }

    this.state.set('testing');

    // Capture timestamp right before ask — used to narrow the REMI query window
    const startedAt = new Date();

    this.sdk.currentKb
      .pipe(
        take(1),
        switchMap((kb) =>
          kb
            .ask(inp.question, undefined, undefined, {
              ...((params.minScoreSemantic !== null || params.minScoreBm25 !== null) && {
                min_score: {
                  ...(params.minScoreSemantic !== null && { semantic: params.minScoreSemantic }),
                  ...(params.minScoreBm25 !== null && { bm25: params.minScoreBm25 }),
                },
              }),
              ...(params.topK !== null && { top_k: params.topK }),
              ...(ragStrategies.length > 0 && { rag_strategies: ragStrategies }),
              ...(params.model && { generative_model: params.model }),
              ...(params.systemPrompt && { prompt: { system: params.systemPrompt } }),
              rephrase: params.rephrase,
            })
            .pipe(last()),
        ),
        catchError((err) => {
          this.errorMessage.set(err?.message || 'Failed to test settings');
          this.state.set('error');
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .subscribe((result: any) => {
        if (result) {
          const answer = result.text || result.answer || '';
          const isNoContext = result.type === 'error' && result.status === -2;
          const record: IterationRecord = {
            round: iterationIndex + 1,
            paramsUsed: { ...params },
            answer,
            remiScore: null,
            remiAnswerRelevance: null,
            remiContentRelevance: null,
            remiGroundedness: null,
            noContext: isNoContext,
            remiPending: !isNoContext && !!answer,
          };
          this.iterations.update((arr) => [...arr, record]);
          this.state.set('tested');

          if (!isNoContext && answer) {
            this.fetchRemiScores(iterationIndex, inp.question, startedAt);
          }
        }
      });
  }

  /**
  /**
   * Fire-and-forget: queries /remi/query with a narrow time window starting just before the ask()
   * call, then matches the result by question text.
   * Backoff schedule: 0s → 10s → 10s → 40s → 2min, stops on first match.
   */
  private fetchRemiScores(iterationIndex: number, question: string, startedAt: Date): void {
    const month = `${startedAt.getFullYear()}-${String(startedAt.getMonth() + 1).padStart(2, '0')}`;

    const criteria: RemiQueryCriteria = {
      month,
      status: 'SUCCESS',
      from_date: startedAt.toISOString(),
      pagination: { limit: 100 },
    };

    const findMatch = (kb: any): Observable<RemiQueryResponseItem | null> =>
      kb.activityMonitor
        .queryRemiScores(criteria)
        .pipe(
          map(
            (response: any): RemiQueryResponseItem | null =>
              (response?.data ?? []).find((item: any) => item.question === question) ?? null,
          ),
        );

    // Attempt immediately, then 10s, 10s, 40s, 2min — stops on first match
    const attempt = (kb: any, delayMs: number): Observable<RemiQueryResponseItem | null> =>
      timer(delayMs).pipe(switchMap(() => findMatch(kb)));

    const pollChain = (kb: any): Observable<RemiQueryResponseItem | null> =>
      attempt(kb, 0).pipe(
        switchMap((r: RemiQueryResponseItem | null) => (r ? of(r) : attempt(kb, 10_000))),
        switchMap((r: RemiQueryResponseItem | null) => (r ? of(r) : attempt(kb, 10_000))),
        switchMap((r: RemiQueryResponseItem | null) => (r ? of(r) : attempt(kb, 40_000))),
        switchMap((r: RemiQueryResponseItem | null) => (r ? of(r) : attempt(kb, 120_000))),
      );

    this.sdk.currentKb
      .pipe(
        take(1),
        switchMap((kb) => pollChain(kb)),
        catchError(() => of(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((match) => {
        const typed = match as RemiQueryResponseItem | null;
        this.ngZone.run(() => {
          this.iterations.update((arr) =>
            arr.map((rec, idx) => {
              if (idx !== iterationIndex) return rec;
              if (!typed?.remi) {
                return { ...rec, remiPending: false };
              }
              const avgContext =
                typed.remi.context_relevance.length > 0
                  ? typed.remi.context_relevance.reduce((a, b) => a + b, 0) / typed.remi.context_relevance.length
                  : null;
              const maxGroundedness = typed.remi.groundedness.length > 0 ? Math.max(...typed.remi.groundedness) : null;
              return {
                ...rec,
                remiPending: false,
                remiAnswerRelevance: typed.remi.answer_relevance?.score ?? null,
                remiContentRelevance: avgContext,
                remiGroundedness: maxGroundedness,
              };
            }),
          );
        });
      });
  }

  analyzeFurther(): void {
    const inp = this.input;
    const latest = this.latestIteration();
    if (!inp || !latest) return;

    this.state.set('analyzing');

    const usedParams = latest.paramsUsed;
    // Pass the actual status of the last tested result so the LLM can see what happened
    const resultStatus = latest.noContext ? '-2' : latest.answer ? '0' : undefined;

    const newInput: AdviceInput = {
      question: inp.question,
      answer: latest.answer,
      context: inp.context,
      remiScores:
        latest.remiAnswerRelevance !== null || latest.remiContentRelevance !== null || latest.remiGroundedness !== null
          ? {
              answerRelevance: latest.remiAnswerRelevance ?? undefined,
              contextRelevance: latest.remiContentRelevance ?? undefined,
              groundedness: latest.remiGroundedness ?? undefined,
            }
          : undefined,
      params: {
        minScoreSemantic: usedParams.minScoreSemantic ?? undefined,
        minScoreBm25: usedParams.minScoreBm25 ?? undefined,
        topK: usedParams.topK ?? undefined,
        ragStrategies: [
          ...(usedParams.neighbouringParagraphs && !usedParams.fullResource ? ['neighbouring_paragraphs'] : []),
          ...(usedParams.fullResource ? ['full_resource'] : []),
          ...(usedParams.metadatas ? ['metadata_extension'] : []),
          ...(usedParams.graph ? ['graph_beta'] : []),
        ],
        model: usedParams.model || undefined,
        rephrase: usedParams.rephrase || undefined,
        systemPrompt: usedParams.systemPrompt || undefined,
      },
      status: resultStatus,
      userExpectation: this.userExpectation() || undefined,
      iterationHistory: this.buildIterationHistory(),
    };

    this.adviceService
      .generateAdvice(newInput)
      .pipe(
        catchError((err) => {
          this.errorMessage.set(err?.message || 'Failed to generate suggestions');
          this.state.set('error');
          return of(null);
        }),
      )
      .subscribe((result) => {
        if (result) {
          this.advice.set(result);
          this.editableParams.set(this.initEditableParams(result));
          this.state.set('advice');
        }
      });
  }

  /** Re-generate advice with full iteration history — user wants to try a different direction. */
  reGenerateAdvice(): void {
    const inp = this.input;
    if (!inp) return;

    this.state.set('analyzing');

    const fullInput: AdviceInput = {
      ...inp,
      userExpectation: this.userExpectation() || undefined,
      iterationHistory: this.buildIterationHistory(),
    };

    this.adviceService
      .generateAdvice(fullInput)
      .pipe(
        catchError((err) => {
          this.errorMessage.set(err?.message || 'Failed to generate suggestions');
          this.state.set('error');
          return of(null);
        }),
      )
      .subscribe((result) => {
        if (result) {
          this.advice.set(result);
          this.editableParams.set(this.initEditableParams(result));
          this.state.set('advice');
        }
      });
  }

  openSaving(): void {
    this.configName.set(this.defaultConfigName());
    this.state.set('saving');
  }

  saveConfig(): void {
    const params = this.editableParams();
    if (!params) return;

    this.savingConfig.set(true);
    const searchConfig = suggestedParamsToSearchConfig(params, `rag-lab-${Date.now()}`);

    this.sdk.currentKb
      .pipe(
        take(1),
        switchMap((kb) => this.searchWidgetService.saveSearchConfig(kb.id, this.configName(), searchConfig)),
        catchError((err) => {
          this.errorMessage.set(err?.message || 'Failed to save configuration');
          this.state.set('error');
          this.savingConfig.set(false);
          return of(null);
        }),
      )
      .subscribe({
        next: () => {
          this.savingConfig.set(false);
          this.state.set('done');
        },
      });
  }

  /** Convert AdviceInput.params to EditableParams shape (baseline). */
  private paramsToEditable(params?: AdviceInput['params']): EditableParams {
    return this.normalizeEditableParams({
      minScoreSemantic: params?.minScoreSemantic ?? null,
      minScoreBm25: params?.minScoreBm25 ?? null,
      topK: params?.topK ?? null,
      neighbouringParagraphs: params?.ragStrategies?.includes('neighbouring_paragraphs') ?? false,
      fullResource: params?.ragStrategies?.includes('full_resource') ?? false,
      metadatas: params?.ragStrategies?.includes('metadata_extension') ?? false,
      graph: params?.ragStrategies?.includes('graph_beta') ?? false,
      rephrase: params?.rephrase ?? false,
      model: params?.model ?? '',
      systemPrompt: params?.systemPrompt ?? '',
    });
  }

  /**
   * Merge the new AI suggestion on top of the CURRENT params (not original), so accumulated
   * suggestions from prior rounds are preserved. Only fields explicitly mentioned in the new
   * suggestion are updated. Also merges the new suggestion into accumulatedSuggestions.
   */
  private initEditableParams(result: AdviceResult): EditableParams {
    // Start from current params to preserve accumulated changes across rounds
    const base = this.editableParams() ?? this.originalParams() ?? this.paramsToEditable(this.input?.params);
    const p = result.suggestedParams ?? {};

    // Build the delta from this suggestion only
    const delta: Partial<EditableParams> = {
      ...(p.minScoreSemantic !== undefined && { minScoreSemantic: p.minScoreSemantic }),
      ...(p.minScoreBm25 !== undefined && { minScoreBm25: p.minScoreBm25 }),
      ...(p.topK !== undefined && { topK: p.topK }),
      ...(p.ragStrategies !== undefined && {
        neighbouringParagraphs: p.ragStrategies.includes('neighbouring_paragraphs'),
        fullResource: p.ragStrategies.includes('full_resource'),
        metadatas: p.ragStrategies.includes('metadata_extension'),
        graph: p.ragStrategies.includes('graph_beta'),
      }),
      ...(p.rephrase !== undefined && { rephrase: p.rephrase }),
      ...(p.model !== undefined && { model: p.model }),
      ...(p.systemPrompt !== undefined && { systemPrompt: p.systemPrompt }),
    };

    // Merge delta into accumulated suggestions (union of all rounds)
    this.accumulatedSuggestions.update((acc) => ({ ...acc, ...delta }));

    return this.normalizeEditableParams({ ...base, ...delta } as EditableParams);
  }

  updateMinScoreSemantic(value: string | number | null): void {
    this.updateEditableParams({
      minScoreSemantic: this.clampNullableDecimal(value, 0, 1),
    });
  }

  updateMinScoreBm25(value: string | number | null): void {
    this.updateEditableParams({
      minScoreBm25: this.clampNullableDecimal(value, 0, 10),
    });
  }

  updateTopK(value: string | number | null): void {
    this.updateEditableParams({
      topK: this.normalizeTopK(value),
    });
  }

  private updateEditableParams(changes: Partial<EditableParams>): void {
    this.editableParams.update((params) => (params ? { ...params, ...changes } : params));
  }

  private normalizeEditableParams(params: EditableParams): EditableParams {
    return {
      ...params,
      minScoreSemantic: this.clampNullableDecimal(params.minScoreSemantic, 0, 1),
      minScoreBm25: this.clampNullableDecimal(params.minScoreBm25, 0, 10),
      topK: this.normalizeTopK(params.topK),
    };
  }

  private parseNullableNumber(value: string | number | null | undefined): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private clampNullableDecimal(value: string | number | null | undefined, min: number, max: number): number | null {
    const parsed = this.parseNullableNumber(value);
    if (parsed === null) {
      return null;
    }
    return Math.min(max, Math.max(min, parsed));
  }

  private normalizeTopK(value: string | number | null | undefined): number | null {
    const parsed = this.parseNullableNumber(value);
    if (parsed === null) {
      return null;
    }
    const normalized = Math.floor(parsed);
    return normalized >= 1 ? normalized : null;
  }

  private buildIterationHistory(): IterationHistoryEntry[] {
    return this.iterations().map((rec) => {
      const strategies = [
        ...(rec.paramsUsed.neighbouringParagraphs && !rec.paramsUsed.fullResource ? ['neighbouring_paragraphs'] : []),
        ...(rec.paramsUsed.fullResource ? ['full_resource'] : []),
        ...(rec.paramsUsed.metadatas ? ['metadata_extension'] : []),
        ...(rec.paramsUsed.graph ? ['graph_beta'] : []),
      ];
      const paramParts = [
        rec.paramsUsed.minScoreSemantic !== null ? `min_score_semantic=${rec.paramsUsed.minScoreSemantic}` : null,
        rec.paramsUsed.minScoreBm25 !== null ? `min_score_bm25=${rec.paramsUsed.minScoreBm25}` : null,
        rec.paramsUsed.topK !== null ? `top_k=${rec.paramsUsed.topK}` : null,
        strategies.length > 0 ? `strategies=[${strategies.join(', ')}]` : null,
        rec.paramsUsed.rephrase ? 'rephrase=true' : null,
        rec.paramsUsed.model ? `model=${rec.paramsUsed.model}` : null,
        rec.paramsUsed.systemPrompt ? `system_prompt="${this.compactSystemPrompt(rec.paramsUsed.systemPrompt)}"` : null,
      ].filter((v): v is string => v !== null);
      return {
        round: rec.round,
        paramsDescription: paramParts.length > 0 ? paramParts.join(', ') : 'default parameters',
        outcome: rec.noContext ? 'no_context' : rec.answer ? 'answer' : 'no_answer',
        answer: rec.answer ? rec.answer.slice(0, 300) : undefined,
        remiScore: rec.remiScore ?? undefined,
        remiAnswerRelevance: rec.remiAnswerRelevance ?? undefined,
        remiContentRelevance: rec.remiContentRelevance ?? undefined,
        remiGroundedness: rec.remiGroundedness ?? undefined,
      };
    });
  }

  private compactSystemPrompt(prompt: string): string {
    return prompt.replace(/\s+/g, ' ').trim().slice(0, 80);
  }

  private defaultConfigName(): string {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `RAG Lab – ${yyyy}-${mm}-${dd}`;
  }
}

/**
 * Helper to open the RAG exploration modal from any component.
 * Usage: openRagAdviceModal(modalService, adviceInput)
 */
export function openRagAdviceModal(modalService: SisModalService, input: AdviceInput): void {
  modalService.openModal(RagAdviceModalComponent, new ModalConfig({ data: input }));
}
