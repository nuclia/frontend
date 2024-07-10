import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  ModalConfig,
  ModalRef,
  PaButtonModule,
  PaCardModule,
  PaExpanderModule,
  PaTextFieldModule,
  PaTogglesModule,
} from '@guillotinaweb/pastanaga-angular';
import { BehaviorSubject, forkJoin, Observable, of, Subject, switchMap, take, tap } from 'rxjs';
import { catchError, filter, map, takeUntil } from 'rxjs/operators';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SDKService, injectScript } from '@flaps/core';
import { Ask, IErrorResponse, LearningConfiguration, Prompts } from '@nuclia/core';
import { LineBreakFormatterPipe } from '../pipes';
import { SisModalService } from '@nuclia/sistema';
import { LoadingDialogComponent } from './loading-dialog';
import DOMPurify from 'dompurify';

const GENERATIVE_MODEL_KEY = 'generative_model';

@Component({
  selector: 'stf-prompt-lab',
  standalone: true,
  imports: [
    CommonModule,
    LineBreakFormatterPipe,
    PaButtonModule,
    PaExpanderModule,
    PaTextFieldModule,
    PaTogglesModule,
    ReactiveFormsModule,
    TranslateModule,
    PaCardModule,
  ],
  templateUrl: './prompt-lab.component.html',
  styleUrl: './prompt-lab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PromptLabComponent implements OnInit {
  private unsubscribeAll = new Subject<void>();

  updateConfigurationExpanderSize = new Subject<unknown>();
  updateResultsExpanderSize = new Subject<unknown>();

  form = new FormGroup({});
  currentQuery = '';
  currentPrompt = '';
  currentSystemPrompt = '';
  queries: string[] = [];
  promptExamples = [
    this.translate.instant('prompt-lab.configuration.prompt.examples.first-example'),
    this.translate.instant('prompt-lab.configuration.prompt.examples.second-example'),
    this.translate.instant('prompt-lab.configuration.prompt.examples.third-example'),
  ];
  systemPromptExamples = [
    this.translate.instant('prompt-lab.configuration.system-prompt.examples.first-example'),
    this.translate.instant('prompt-lab.configuration.system-prompt.examples.second-example'),
    this.translate.instant('prompt-lab.configuration.system-prompt.examples.third-example'),
  ];

  configBackup?: { [id: string]: any };
  learningModels?: LearningConfiguration;
  loadingModal?: ModalRef;
  progress$ = new BehaviorSubject<number | null>(null);
  results: {
    query: string;
    prompt?: Prompts;
    results: { model: string; modelName: string; answer: string; rendered?: string }[];
  }[] = [];
  hasResults = new BehaviorSubject(false);
  queryCollapsed: { [query: string]: boolean } = {};

  get selectedModels(): string[] {
    return Object.entries(this.form.getRawValue())
      .filter(([, value]) => value)
      .map(([key]) => key);
  }

  get questionsLimitReached() {
    return this.queries.length >= 3;
  }

  constructor(
    private cdr: ChangeDetectorRef,
    private sdk: SDKService,
    private modalService: SisModalService,
    private translate: TranslateService,
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
        switchMap((kb) => forkJoin([kb.getConfiguration(), kb.getLearningSchema()])),
      )
      .subscribe(([config, schema]) => {
        this.configBackup = config;
        this.learningModels = {
          ...schema[GENERATIVE_MODEL_KEY],
          options: [
            ...(schema[GENERATIVE_MODEL_KEY]?.options?.filter((model) => model.name !== 'Do not generate answers') || []),
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

  deleteQuestion($index: number) {
    this.queries.splice($index, 1);
    this.updateConfigurationExpanderSize.next([...this.queries]);
  }

  generate() {
    if (this.queries.length === 0 || this.selectedModels.length === 0 || !this.configBackup) {
      return;
    }

    this.progress$.next(null);
    const requestCount = this.queries.length * this.selectedModels.length;
    this.results = [];

    this.loadingModal = this.modalService.openModal(
      LoadingDialogComponent,
      new ModalConfig<{ title: string; description: string; progress: Observable<number | null> }>({
        dismissable: false,
        data: {
          title: 'prompt-lab.generate.loading.title',
          description: 'prompt-lab.generate.loading.description',
          progress: this.progress$
            .asObservable()
            .pipe(map((progress) => Math.ceil(((progress || 0) * 100) / requestCount))),
        },
      }),
    );
    this.progress$.pipe(filter((progress) => progress === requestCount)).subscribe(() => {
      this.loadingModal?.close();
      this.hasResults.next(this.results.length > 0);
    });
    this._generateResults(this.queries, this.currentPrompt, this.currentSystemPrompt).subscribe();
  }

  private _generateResults(queries: string[], userPrompt: string, systemPrompt: string): Observable<any> {
    const prompt =
      userPrompt || systemPrompt ? { user: userPrompt || undefined, system: systemPrompt || undefined } : undefined;
    const requests: { query: string; prompt?: Prompts; model: string }[] = queries.reduce(
      (requests, query) => requests.concat(this.selectedModels.map((model) => ({ query, prompt, model }))),
      [] as { query: string; prompt?: Prompts; model: string }[],
    );

    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) =>
        forkJoin(
          requests.map(({ query, prompt, model }) =>
            kb
              .ask(query, undefined, undefined, {
                synchronous: true,
                prompt,
                generative_model: model,
              })
              .pipe(
                switchMap((answer) => {
                  if (answer.type === 'error') {
                    return of(answer);
                  } else {
                    return this.renderMarkdown(answer.text).pipe(
                      tap((rendered) => this._addResult({ model, query, prompt, result: answer, rendered })),
                    );
                  }
                }),
                catchError((error) => {
                  this._addResult({
                    model,
                    query,
                    prompt,
                    result: this.translate.instant('prompt-lab.results.error'),
                  });
                  return of(null);
                }),
              ),
          ),
        ),
      ),
    );
  }

  private _addResult(entry: {
    model: string;
    query: string;
    prompt?: Prompts;
    result: Ask.Answer | IErrorResponse | string;
    rendered?: string;
  }) {
    const { model, query, prompt, result } = entry;
    const modelName = this.getModelName(model);
    const queryEntry = this.results.find((entry) => entry.query === query);
    const answer =
      typeof result === 'string'
        ? result
        : result.type === 'answer'
          ? (result as Ask.Answer).text
          : `Error: ${result.detail}`;
    if (queryEntry) {
      queryEntry.results.push({ model, modelName, answer, rendered: entry.rendered });
    } else {
      this.results.push({ query, prompt, results: [{ model, modelName, answer, rendered: entry.rendered }] });
    }

    this.progress$.next((this.progress$.value || 0) + 1);
    this.updateResultsExpanderSize.next(result);
  }

  renderMarkdown(text: string): Observable<string> {
    return injectScript('//cdn.jsdelivr.net/npm/marked/marked.min.js').pipe(
      take(1),
      map(() => DOMPurify.sanitize((window as any)['marked'].parse(text, { mangle: false, headerIds: false }))),
    );
  }

  collapseAnswer(query: string) {
    this.queryCollapsed[query] = !this.queryCollapsed[query];
  }

  downloadCsv() {
    if (this.results.length === 0) {
      return;
    }
    let csv = `Query,${this.selectedModels.map((model) => this.getModelName(model)).join(',')}`;
    this.results.forEach(({ query, prompt, results }) => {
      const answers = this.selectedModels
        .map((model) => {
          const modelResult = results.find((result) => result.model === model);
          return `"${this.formatCellValue(modelResult?.answer || 'No answer')}"`;
        })
        .join(',');
      csv += `\n"Query: ${this.formatCellValue(query)}${
        (prompt?.user ? '\nPrompt: ' + this.formatCellValue(prompt.user) : '') +
        (prompt?.system ? '\nSystem prompt: ' + this.formatCellValue(prompt.system) : '')
      }",${answers}`;
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

  private getModelName(model: string) {
    return this.learningModels?.options?.find((option) => option.value === model)?.name || model;
  }

  setPrompt(value: string) {
    if (value) {
      this.currentPrompt = value;
      this.cdr.markForCheck();
    }
  }
  setSystemPrompt(value: string) {
    if (value) {
      this.currentSystemPrompt = value;
      this.cdr.markForCheck();
    }
  }
}
