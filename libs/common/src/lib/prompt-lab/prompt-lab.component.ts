import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import {
  ModalConfig,
  ModalRef,
  PaButtonModule,
  PaExpanderModule,
  PaTextFieldModule,
  PaTogglesModule,
} from '@guillotinaweb/pastanaga-angular';
import {
  BehaviorSubject,
  concat,
  concatMap,
  filter,
  forkJoin,
  from,
  Observable,
  of,
  Subject,
  switchMap,
  take,
  tap,
} from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SDKService } from '@flaps/core';
import { Chat, IErrorResponse, LearningConfiguration } from '@nuclia/core';
import { GenerativeModelPipe, LineBreakFormatterPipe } from '../pipes';
import { SisModalService } from '@nuclia/sistema';
import { LoadingDialogComponent } from './loading-dialog';

const GENERATIVE_MODEL_KEY = 'generative_model';

@Component({
  selector: 'stf-prompt-lab',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    PaExpanderModule,
    PaTextFieldModule,
    PaButtonModule,
    ReactiveFormsModule,
    PaTogglesModule,
    LineBreakFormatterPipe,
    GenerativeModelPipe,
  ],
  providers: [GenerativeModelPipe],
  templateUrl: './prompt-lab.component.html',
  styleUrl: './prompt-lab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PromptLabComponent implements OnInit {
  private unsubscribeAll = new Subject<void>();

  updateConfigurationExpanderSize = new Subject<unknown>();

  form = new FormGroup({});
  currentQuery = '';
  currentPrompt = '';
  queries: string[] = [];
  prompts: string[] = [];

  configBackup?: { [id: string]: any };
  learningModels?: LearningConfiguration;
  loadingModal?: ModalRef;
  progress$ = new BehaviorSubject<number | null>(null);
  results: { query: string; data: { prompt?: string; results: { model: string; answer: string }[] }[] }[] = [];
  hasResults = new BehaviorSubject(false);
  modelCollapsed: { [id: string]: boolean } = {};

  get selectedModels(): string[] {
    return Object.entries(this.form.getRawValue())
      .filter(([, value]) => value)
      .map(([key]) => key);
  }

  get questionsLimitReached() {
    return this.queries.length >= 3;
  }

  get promptsLimitReached() {
    return this.prompts.length >= 3;
  }

  constructor(
    private cdr: ChangeDetectorRef,
    private sdk: SDKService,
    private modalService: SisModalService,
    private generativeModelPipe: GenerativeModelPipe,
  ) {}

  ngOnInit() {
    this.updateConfigurationExpanderSize
      .pipe(
        tap(() => this.cdr.detectChanges()),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe();
    this.sdk.currentKb
      .pipe(
        take(1),
        switchMap((kb) => kb.getConfiguration()),
      )
      .subscribe((config) => (this.configBackup = config));
    this.sdk.nuclia.db.getLearningConfigurations().subscribe((learningConfig) => {
      this.learningModels = {
        ...learningConfig[GENERATIVE_MODEL_KEY],
        options: [
          ...(learningConfig[GENERATIVE_MODEL_KEY]?.options?.filter((model) => model.name !== 'NO_GENERATION') || []),
        ],
      };
      this.learningModels.options?.forEach((model) => {
        this.form.addControl(model.value, new FormControl<boolean>(false, { nonNullable: true }));
      });
      this.updateConfigurationExpanderSize.next(this.form.getRawValue());
    });
  }

  onResizingTextarea($event: DOMRect) {
    this.updateConfigurationExpanderSize.next($event);
  }

  addQuestion() {
    this.queries = this.queries.concat([this.currentQuery.trim()]);
    this.currentQuery = '';
    this.updateConfigurationExpanderSize.next(this.queries);
  }

  addPrompt() {
    this.prompts = this.prompts.concat([this.currentPrompt.trim()]);
    this.currentPrompt = '';
    this.updateConfigurationExpanderSize.next(this.prompts);
  }

  deleteQuestion($index: number) {
    this.queries.splice($index, 1);
    this.updateConfigurationExpanderSize.next([...this.queries]);
  }

  deletePrompt($index: number) {
    this.prompts.splice($index, 1);
    this.updateConfigurationExpanderSize.next([...this.prompts]);
  }

  generate() {
    if (this.queries.length === 0 || this.selectedModels.length === 0 || !this.configBackup) {
      return;
    }

    this.modalService
      .openConfirm({
        title: 'prompt-lab.generate.confirmation.title',
        description: 'prompt-lab.generate.confirmation.inconsistency-warning',
      })
      .onClose.pipe(
        filter((confirm) => !!confirm),
        switchMap(() => {
          this.loadingModal = this.modalService.openModal(
            LoadingDialogComponent,
            new ModalConfig<{ title: string; description: string; progress: Observable<number | null> }>({
              dismissable: false,
              data: {
                title: 'prompt-lab.generate.loading.title',
                description: 'prompt-lab.generate.loading.description',
                progress: this.progress$.asObservable(),
              },
            }),
          );
          return this._generateResults(this.queries, this.prompts);
        }),
      )
      .subscribe();
  }

  private _generateResults(queries: string[], prompts: string[]): Observable<any> {
    const requests: { query: string; prompt?: string }[] = queries.reduce(
      (requests, query) => {
        if (prompts.length > 0) {
          requests = requests.concat(prompts.map((prompt) => ({ query, prompt })));
        } else {
          requests.push({ query });
        }
        return requests;
      },
      [] as { query: string; prompt?: string }[],
    );

    const requestCount = requests.length * this.selectedModels.length;
    return this.sdk.currentKb.pipe(
      take(1),
      concatMap((kb) =>
        concat(
          // First we run the queries for each model and prompts in sequence
          concat(from(this.selectedModels)).pipe(
            concatMap((model) => {
              return kb.setConfiguration({ [GENERATIVE_MODEL_KEY]: model }).pipe(
                concatMap(() =>
                  forkJoin(
                    requests.map(({ query, prompt }) =>
                      kb
                        .chat(query, undefined, undefined, {
                          synchronous: true,
                          prompt,
                        })
                        .pipe(
                          tap((answer) => {
                            this._addResult({ model, query, prompt, result: answer }, requestCount);
                          }),
                          catchError((error) => {
                            this._addResult({ model, query, prompt, result: `Error: ${error}` }, requestCount);
                            return of(null);
                          }),
                        ),
                    ),
                  ),
                ),
              );
            }),
          ),
          // Then we put back the KB as it was
          this.sdk.currentKb.pipe(
            take(1),
            concatMap((kb) => {
              const modelBackup = this.configBackup?.[GENERATIVE_MODEL_KEY];
              return kb.setConfiguration({ [GENERATIVE_MODEL_KEY]: modelBackup });
            }),
            tap(() => {
              this.hasResults.next(this.results.length > 0);
              this.loadingModal?.close();
            }),
          ),
        ),
      ),
    );
  }

  private _addResult(
    entry: {
      model: string;
      query: string;
      prompt: string | undefined;
      result: Chat.Answer | IErrorResponse | string;
    },
    requestCount: number,
  ) {
    const { model, query, prompt, result } = entry;
    const queryEntry = this.results.find((entry) => entry.query === query);
    const answer =
      typeof result === 'string'
        ? result
        : result.type === 'answer'
          ? (result as Chat.Answer).text
          : `Error: ${result.detail}`;
    if (queryEntry) {
      const promptEntry = queryEntry.data.find((entry) => entry.prompt === prompt);
      if (promptEntry) {
        promptEntry.results.push({ model, answer });
      } else {
        queryEntry.data.push({ prompt, results: [{ model, answer }] });
      }
    } else {
      this.results.push({ query, data: [{ prompt, results: [{ model, answer }] }] });
    }

    this.progress$.next((this.progress$.value || 0) + Math.ceil(100 / requestCount));
  }

  collapseAnswer(query: string, prompt: string | undefined, model: string) {
    const fullId = query + prompt + model;
    this.modelCollapsed[fullId] = !this.modelCollapsed[fullId];
  }

  downloadCsv() {
    if (this.results.length === 0) {
      return;
    }
    let csv = `Query,${this.selectedModels.map((model) => this.generativeModelPipe.transform(model)).join(',')}`;
    this.results.forEach((item) => {
      item.data.forEach(({ prompt, results }) => {
        const answers = this.selectedModels
          .map((model) => {
            const modelResult = results.find((result) => result.model === model);
            return `"${this.formatCellValue(modelResult?.answer || 'No answer')}"`;
          })
          .join(',');
        csv += `\n"Query: ${this.formatCellValue(item.query)}${
          prompt ? '\nPrompt: ' + this.formatCellValue(prompt) : ''
        }",${answers}`;
      });
    });
    const filename = `${new Date().toISOString().split('T')[0]}_Nuclia_models_comparison.csv`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.click();
      URL.revokeObjectURL(url);
    }
  }

  private formatCellValue(value: string): string {
    return value.trim().replace(/"/g, '""');
  }
}
