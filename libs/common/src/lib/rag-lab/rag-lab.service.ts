import { inject, Injectable } from '@angular/core';
import { renderMarkdown, SDKService } from '@flaps/core';
import { ModalConfig, ModalRef, ModalService } from '@guillotinaweb/pastanaga-angular';
import { BehaviorSubject, forkJoin, Observable, of, switchMap, take, tap } from 'rxjs';
import { Ask, ChatOptions, IErrorResponse, LearningConfiguration, Prompts } from '@nuclia/core';
import { LoadingDialogComponent } from './loading-dialog';
import { catchError, filter, map } from 'rxjs/operators';
import { NUCLIA_STANDARD_SEARCH_CONFIG, SearchConfiguration, SearchWidgetService } from '../search-widget';
import { GENERATIVE_MODEL_KEY, RequestConfig, RequestConfigAndQueries, ResultEntry } from './rag-lab.models';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root',
})
export class RagLabService {
  private sdk = inject(SDKService);
  private modalService = inject(ModalService);
  private translate = inject(TranslateService);
  private searchWidgetService = inject(SearchWidgetService);

  private _loadingModal?: ModalRef;
  private _progress$ = new BehaviorSubject<number | null>(null);
  private _promptLabResults = new BehaviorSubject<
    {
      query: string;
      prompt?: Prompts;
      results: ResultEntry[];
    }[]
  >([]);
  private _ragLabResults = new BehaviorSubject<
    {
      query: string;
      prompt?: Prompts;
      results: ResultEntry[];
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
      take(1),
      switchMap((kb) =>
        forkJoin([
          kb.getConfiguration(),
          kb.getLearningSchema(),
          this.searchWidgetService.supportedSearchConfigurations.pipe(take(1)),
        ]),
      ),
      map(([config, schema, savedConfigurations]) => {
        this._searchConfigurations.next([{ ...NUCLIA_STANDARD_SEARCH_CONFIG }].concat(savedConfigurations));
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

  generate(requestConfigs: RequestConfigAndQueries[], forTab: 'prompt' | 'rag') {
    this._progress$.next(null);
    const requestCount = requestConfigs.reduce((count, requestConfig) => {
      return count + requestConfig.queries.length;
    }, 0);

    if (forTab === 'prompt') {
      this._promptLabResults.next([]);
    } else if (forTab === 'rag') {
      this._ragLabResults.next([]);
    }

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

    return this._generateResults(requestConfigs, forTab);
  }

  private _generateResults(requestConfigs: RequestConfigAndQueries[], forTab: 'prompt' | 'rag') {
    const requests: { query: string; options: ChatOptions }[] = requestConfigs.reduce(
      (requests, config) => {
        const { queries, ...options } = config;
        return requests.concat(queries.map((query) => ({ query, options })));
      },
      [] as { query: string; options: ChatOptions }[],
    );

    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) =>
        forkJoin(
          requests.map(({ query, options }) =>
            kb
              .ask(query, undefined, undefined, {
                ...options,
                synchronous: true,
              })
              .pipe(
                switchMap((answer) => {
                  if (answer.type === 'error') {
                    this._addResult(
                      {
                        query,
                        options,
                        result:
                          answer.status === -1
                            ? this.translate.instant('rag-lab.common.results.error-llm')
                            : this.translate.instant('rag-lab.common.results.error'),
                      },
                      forTab,
                    );
                    return of(null);
                  } else {
                    return renderMarkdown(answer.text).pipe(
                      tap((rendered) =>
                        this._addResult(
                          {
                            query,
                            result: answer,
                            options,
                            rendered,
                          },
                          forTab,
                        ),
                      ),
                    );
                  }
                }),
                catchError(() => {
                  this._addResult(
                    {
                      query,
                      options,
                      result: this.translate.instant('rag-lab.common.results.error'),
                    },
                    forTab,
                  );
                  return of(null);
                }),
              ),
          ),
        ),
      ),
    );
  }

  private _addResult(
    entry: {
      query: string;
      result: Ask.Answer | IErrorResponse | string;
      options: RequestConfig;
      rendered?: string;
    },
    forTab: 'prompt' | 'rag',
  ) {
    const { query, options, result } = entry;
    const configId = options.searchConfigId;
    const model = options.generative_model as string;
    const modelName = this.getModelName(model);
    const results = forTab === 'prompt' ? this._promptLabResults : this._ragLabResults;
    const entries = results.value;
    const entryIndex = entries.findIndex((entry) => entry.query === query);
    const queryEntry = entryIndex > -1 ? entries[entryIndex] : null;
    const answer =
      typeof result === 'string'
        ? result
        : result.type === 'answer'
          ? (result as Ask.Answer).text
          : `Error: ${result.detail}`;
    if (queryEntry) {
      queryEntry.results.push({ configId, model, modelName, answer, rendered: entry.rendered });
      entries.splice(entryIndex, 1, queryEntry);
      results.next([...entries]);
    } else {
      results.next(
        entries.concat([
          {
            query,
            prompt: options.prompt as Prompts,
            results: [{ configId, model, modelName, answer, rendered: entry.rendered }],
          },
        ]),
      );
    }

    this._progress$.next((this._progress$.value || 0) + 1);
  }

  downloadPromptLabCsv(generativeModels: string[]) {
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
    this.generateCsv(csv, filename);
  }

  downloadRagLabCsv(configs: { configId: string; generativeModel: string }[]) {
    if (this._ragLabResults.value.length === 0) {
      return;
    }
    let csv = `Query,${configs.map((config) => `${config.configId} (${config.generativeModel})`).join(',')}`;
    this._ragLabResults.value.forEach(({ query, prompt, results }) => {
      const answers = configs
        .map((config) => {
          const modelResult = results.find((result) => result.configId === config.configId);
          return `"${this.formatCellValue(modelResult?.answer || 'No answer')}"`;
        })
        .join(',');
      csv += `\n"Query: ${this.formatCellValue(query)}${
        (prompt?.user ? '\nPrompt: ' + this.formatCellValue(prompt.user) : '') +
        (prompt?.system ? '\nSystem prompt: ' + this.formatCellValue(prompt.system) : '')
      }",${answers}`;
    });
    const filename = `${new Date().toISOString().split('T')[0]}_Nuclia_RAG_comparison.csv`;
    this.generateCsv(csv, filename);
  }

  private generateCsv(csv: string, filename: string) {
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
