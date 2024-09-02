import { inject, Injectable } from '@angular/core';
import { injectScript, SDKService } from '@flaps/core';
import { ModalConfig, ModalRef, ModalService } from '@guillotinaweb/pastanaga-angular';
import { BehaviorSubject, forkJoin, Observable, of, switchMap, take, tap } from 'rxjs';
import { Ask, IErrorResponse, LearningConfiguration, Prompts } from '@nuclia/core';
import { LoadingDialogComponent } from './loading-dialog';
import { catchError, filter, map } from 'rxjs/operators';
import DOMPurify from 'dompurify';
import { SearchAndWidgets, SearchConfiguration } from '../search-widget';
import { GENERATIVE_MODEL_KEY } from './rag-lab.models';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root',
})
export class RagLabService {
  private sdk = inject(SDKService);
  private modalService = inject(ModalService);
  private translate = inject(TranslateService);

  private _loadingModal?: ModalRef;
  private _progress$ = new BehaviorSubject<number | null>(null);
  private _promptLabResults = new BehaviorSubject<
    {
      query: string;
      prompt?: Prompts;
      results: { model: string; modelName: string; answer: string; rendered?: string }[];
    }[]
  >([]);
  private _ragLabResults = new BehaviorSubject<
    {
      query: string;
      prompt?: Prompts;
      results: { model: string; modelName: string; answer: string; rendered?: string }[];
    }[]
  >([]);

  private _kbConfigBackup = new BehaviorSubject<{ [id: string]: any } | null>(null);
  private _generativeModelList = new BehaviorSubject<LearningConfiguration | null>(null);
  private _generativeModelMap = new BehaviorSubject<{ [value: string]: string } | null>(null);
  private _searchConfigurations = new BehaviorSubject<SearchConfiguration[]>([]);

  kbConfigBackup = this._kbConfigBackup.asObservable();
  generativeModelList = this._generativeModelList.asObservable();
  generativeModelMap = this._generativeModelMap.asObservable();
  searchConfigurations = this._searchConfigurations.asObservable();
  promptLabResults = this._promptLabResults.asObservable();
  ragLabResults = this._ragLabResults.asObservable();

  private getModelName(model: string) {
    return this._generativeModelList.value?.options?.find((option) => option.value === model)?.name || model;
  }

  loadKbConfigAndModels(): Observable<void> {
    return this.sdk.currentKb.pipe(
      tap((kb) => {
        this._searchConfigurations.next((kb.search_configs as SearchAndWidgets)?.searchConfigurations || []);
      }),
      switchMap((kb) => forkJoin([kb.getConfiguration(), kb.getLearningSchema()])),
      map(([config, schema]) => {
        this._kbConfigBackup.next(config);
        this._generativeModelList.next({
          ...schema[GENERATIVE_MODEL_KEY],
          options: [
            ...(schema[GENERATIVE_MODEL_KEY]?.options?.filter((model) => model.name !== 'Do not generate answers') ||
              []),
          ],
        });
        this._generativeModelMap.next(
          (this._generativeModelList.value?.options || []).reduce(
            (models, option) => {
              models[option.value] = option.name;
              return models;
            },
            {} as { [value: string]: string },
          ),
        );
      }),
    );
  }

  generate(queries: string[], generativeModels: string[], prompts?: { userPrompt: string; systemPrompt: string }) {
    this._progress$.next(null);
    const requestCount = queries.length * generativeModels.length;
    this._promptLabResults.next([]);

    this._loadingModal = this.modalService.openModal(
      LoadingDialogComponent,
      new ModalConfig<{ title: string; description: string; progress: Observable<number | null> }>({
        dismissable: false,
        data: {
          title: 'rag-lab.common.generate.loading.title',
          description: 'rag-lab.common.generate.loading.description',
          progress: this._progress$
            .asObservable()
            .pipe(map((progress) => Math.ceil(((progress || 0) * 100) / requestCount))),
        },
      }),
    );
    this._progress$.pipe(filter((progress) => progress === requestCount)).subscribe(() => this._loadingModal?.close());

    return this._generateResults(queries, generativeModels, prompts);
  }

  private _generateResults(
    queries: string[],
    generativeModels: string[],
    prompts?: { userPrompt: string; systemPrompt: string },
  ) {
    const prompt = prompts
      ? { user: prompts.userPrompt || undefined, system: prompts.systemPrompt || undefined }
      : undefined;
    const requests: { query: string; prompt?: Prompts; model: string }[] = queries.reduce(
      (requests, query) => requests.concat(generativeModels.map((model) => ({ query, prompt, model }))),
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
    const entries = this._promptLabResults.value;
    const entryIndex = entries.findIndex((entry) => entry.query === query);
    const queryEntry = entryIndex > -1 ? this._promptLabResults.value[entryIndex] : null;
    const answer =
      typeof result === 'string'
        ? result
        : result.type === 'answer'
          ? (result as Ask.Answer).text
          : `Error: ${result.detail}`;
    if (queryEntry) {
      queryEntry.results.push({ model, modelName, answer, rendered: entry.rendered });
      entries.splice(entryIndex, 1, queryEntry);
      this._promptLabResults.next([...entries]);
    } else {
      this._promptLabResults.next(
        this._promptLabResults.value.concat([
          { query, prompt, results: [{ model, modelName, answer, rendered: entry.rendered }] },
        ]),
      );
    }

    this._progress$.next((this._progress$.value || 0) + 1);
  }

  renderMarkdown(text: string): Observable<string> {
    return injectScript('//cdn.jsdelivr.net/npm/marked/marked.min.js').pipe(
      take(1),
      map(() => DOMPurify.sanitize((window as any)['marked'].parse(text, { mangle: false, headerIds: false }))),
    );
  }

  downloadCsv(generativeModels: string[]) {
    if (this._promptLabResults.value.length === 0) {
      return;
    }
    let csv = `Query,${generativeModels.map((model) => this.getModelName(model)).join(',')}`;
    this._promptLabResults.value.forEach(({ query, prompt, results }) => {
      const answers = generativeModels
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
}
