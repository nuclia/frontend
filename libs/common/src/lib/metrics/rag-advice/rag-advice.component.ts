import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
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
} from '@guillotinaweb/pastanaga-angular';
import { InfoCardComponent, SisModalService, SisProgressModule } from '@nuclia/sistema';
import { AdviceInput, AdviceResult, RagAdviceService } from './rag-advice.service';
import { SDKService } from '@flaps/core';
import { RAGStrategy, RagStrategyName } from '@nuclia/core';
import { catchError, of, switchMap, take } from 'rxjs';

type ModalState = 'input' | 'loading' | 'advice' | 'rerunning' | 'result' | 'error';

/**
 * RAG Advice modal — opened via SisModalService.openModal(RagAdviceModalComponent, new ModalConfig({ data: adviceInput })).
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
    InfoCardComponent,
    SisProgressModule,
  ],
  templateUrl: './rag-advice.component.html',
  styleUrl: './rag-advice.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RagAdviceModalComponent {
  private adviceService = inject(RagAdviceService);
  private sdk = inject(SDKService);

  readonly state = signal<ModalState>('input');
  readonly userExpectation = signal('');
  readonly advice = signal<AdviceResult | null>(null);
  readonly rerunResult = signal<{ answer: string } | null>(null);
  readonly errorMessage = signal('');

  readonly hasRerunOption = computed(() => {
    const a = this.advice();
    return !!a?.suggestedParams && Object.keys(a.suggestedParams).length > 0;
  });

  // Expose input data from ModalRef for the template
  get input(): AdviceInput | undefined {
    return this.modal.config.data;
  }

  constructor(public modal: ModalRef<AdviceInput>) {}

  generateAdvice(): void {
    const inp = this.input;
    if (!inp) return;
    this.state.set('loading');

    const fullInput: AdviceInput = {
      ...inp,
      userExpectation: this.userExpectation() || undefined,
    };

    this.adviceService
      .generateAdvice(fullInput)
      .pipe(
        catchError((err) => {
          this.errorMessage.set(err?.message || 'Failed to generate advice');
          this.state.set('error');
          return of(null);
        }),
      )
      .subscribe((result) => {
        if (result) {
          this.advice.set(result);
          this.state.set('advice');
        }
      });
  }

  rerunWithSuggestions(): void {
    const inp = this.input;
    const params = this.advice()?.suggestedParams;
    if (!inp || !params) return;
    this.state.set('rerunning');

    const ragStrategies: RAGStrategy[] = (params.ragStrategies ?? [])
      .filter((name) => name !== 'prequeries')
      .map((name): RAGStrategy => {
        if (name === 'neighbouring_paragraphs') {
          return { name: RagStrategyName.NEIGHBOURING_PARAGRAPHS, before: 1, after: 1 };
        }
        if (name === 'hierarchy') {
          return { name: RagStrategyName.HIERARCHY };
        }
        if (name === 'full_resource') {
          return { name: RagStrategyName.FULL_RESOURCE };
        }
        // pass through any other strategy name as-is
        return { name } as RAGStrategy;
      });

    this.sdk.currentKb
      .pipe(
        take(1),
        switchMap((kb) =>
          kb.ask(inp.question, undefined, undefined, {
            synchronous: true,
            min_score: {
              semantic: params.minScoreSemantic ?? inp.params?.minScoreSemantic,
              bm25: params.minScoreBm25 ?? inp.params?.minScoreBm25,
            },
            ...(params.topK !== undefined && { top_k: params.topK }),
            ...(ragStrategies.length > 0 && { rag_strategies: ragStrategies }),
            ...(params.model && { generative_model: params.model }),
            ...(params.systemPrompt && { prompt: { system: params.systemPrompt } }),
            ...(params.rephrase !== undefined && { rephrase: params.rephrase }),
          }),
        ),
        catchError((err) => {
          this.errorMessage.set(err?.message || 'Failed to re-run query');
          this.state.set('error');
          return of(null);
        }),
      )
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .subscribe((result: any) => {
        if (result) {
          const text = result.text || result.answer || '';
          this.rerunResult.set({ answer: text });
          this.state.set('result');
        }
      });
  }
}

/**
 * Helper to open the RAG Advice modal from any component.
 * Usage: openRagAdviceModal(modalService, adviceInput)
 */
export function openRagAdviceModal(modalService: SisModalService, input: AdviceInput): void {
  modalService.openModal(RagAdviceModalComponent, new ModalConfig({ data: input }));
}
