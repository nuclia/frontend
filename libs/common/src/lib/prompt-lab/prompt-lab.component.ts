import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import {
  ModalConfig,
  ModalRef,
  PaButtonModule,
  PaCardModule,
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
    GenerativeModelPipe,
    LineBreakFormatterPipe,
    PaButtonModule,
    PaExpanderModule,
    PaTextFieldModule,
    PaTogglesModule,
    ReactiveFormsModule,
    TranslateModule,
    PaCardModule,
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

  configBackup?: { [id: string]: any };
  learningModels?: LearningConfiguration;
  loadingModal?: ModalRef;
  progress$ = new BehaviorSubject<number | null>(null);
  results: { query: string; data: { prompt?: string; results: { model: string; answer: string }[] }[] }[] = [
    {
      query: 'Who is Eudald?',
      data: [
        {
          prompt:
            'Taking into account this provided context.\n    Context:\n    {context}\n    Answer this QUESTION: "{question}" like a solution engineer working for Nuclia and providing technical support to customers. PLEASE, do not mention your role, just give the answer and do not ask follow up questions or offer anything.\nANSWER:',
          results: [
            {
              model: 'chatgpt-azure',
              answer:
                "Eudald Camprubi is a key contributor to Nuclia, shaping the new generation of AI search engines. He has written extensively on topics such as vector search, the benefits of AI search for applications, and the future of low-code AI-powered search engines. He also provides detailed guides on how to use and optimize Nuclia's features, such as changing the language model, activating generative answers, and using AI Search Copilots to enhance business efficiency. His work is instrumental in making the unsearchable, searchable.",
            },
            {
              model: 'chatgpt-azure-3',
              answer:
                'Eudald Camprubi is a key figure at Nuclia, contributing to the development and implementation of AI-powered search engines and providing technical support to customers.',
            },
          ],
        },
        {
          prompt:
            'Answer this QUESTION "{question}" as a support engineer working for Nuclia. Be precise in your answer and stay polite.',
          results: [
            {
              model: 'chatgpt-azure',
              answer:
                "Dear User,\n\nThank you for your inquiry. However, as a support engineer at Nuclia, I must inform you that we don't have any information related to an individual named \"Eudald\" in our database. It's possible that you may be referring to a person or entity outside of our company's scope. If you have any other questions or need further assistance related to our products or services, please feel free to ask.\n\nBest Regards,\n[Your Name]\nNuclia Support Engineer",
            },
            {
              model: 'chatgpt-azure-3',
              answer:
                'Eudald is a support engineer working for Nuclia. He is a dedicated and knowledgeable professional who is committed to providing excellent support and assistance to our customers.',
            },
          ],
        },
      ],
    },
    {
      query: 'What is a vector?',
      data: [
        {
          prompt:
            'Answer this QUESTION "{question}" as a support engineer working for Nuclia. Be precise in your answer and stay polite.',
          results: [
            {
              model: 'chatgpt-azure',
              answer:
                "Dear User,\n\nThank you for reaching out to Nuclia Support!\n\nA vector, in the context of physics and mathematics, is a quantity characterized by both magnitude (or size) and direction. It is typically represented graphically by an arrow pointing in the specified direction, with the length of the arrow representing the magnitude of the vector. Examples of vectors include force, velocity, and displacement.\n\nIn the context of computer science, a vector can also refer to a dynamic array or list structure that can grow or shrink in size as needed.\n\nI hope this information is helpful to you. If you have any further questions or need clarification on any points, please don't hesitate to ask.\n\nBest Regards,\nNuclia Support Team",
            },
            {
              model: 'chatgpt-azure-3',
              answer:
                'A vector is a quantity that has both magnitude and direction. In the context of Nuclia, vectors are often used to represent physical quantities such as velocity, force, and displacement. They are essential in understanding and analyzing the movement and behavior of particles and objects in nuclear systems. If you have any further questions or need more information, feel free to ask.',
            },
          ],
        },
        {
          prompt:
            'Taking into account this provided context.\n    Context:\n    {context}\n    Answer this QUESTION: "{question}" like a solution engineer working for Nuclia and providing technical support to customers. PLEASE, do not mention your role, just give the answer and do not ask follow up questions or offer anything.\nANSWER:',
          results: [
            {
              model: 'chatgpt-azure',
              answer:
                'A vector, in the context of information retrieval and natural language processing, is a mathematical representation of data. Vectors are used to represent various types of data, including text documents, in a multi-dimensional space. This representation allows for the comparison of data points in a meaningful way, even if they do not have any explicit connections or relationships. For instance, in a vector database like NucliaDB, each document or data point is represented as a vector. This enables the comparison of documents or data points based on their vector representations, making it possible to find related or relevant documents or data points in large datasets. This technique is known as vector search.',
            },
            {
              model: 'chatgpt-azure-3',
              answer:
                'A vector is a mathematical representation of a data point that captures its features or characteristics, allowing for meaningful comparison and retrieval of similar documents or data. In the context of NucliaDB, vectors are used to enable efficient and effective search and retrieval of unstructured data.',
            },
          ],
        },
      ],
    },
    {
      query: 'What is an embedding?',
      data: [
        {
          prompt:
            'Taking into account this provided context.\n    Context:\n    {context}\n    Answer this QUESTION: "{question}" like a solution engineer working for Nuclia and providing technical support to customers. PLEASE, do not mention your role, just give the answer and do not ask follow up questions or offer anything.\nANSWER:',
          results: [
            {
              model: 'chatgpt-azure',
              answer:
                'An embedding, in the context of machine learning, is a representation of data in a vector space. This means that complex data like text, images, or videos are converted into numerical vectors. These vectors capture the essential characteristics of the data, making it easier for machine learning algorithms to understand and process. For instance, in Nuclia, we use embeddings to transform unstructured data into a format that our AI Search can easily analyze and generate relevant results from.',
            },
            {
              model: 'chatgpt-azure-3',
              answer:
                'An embedding is a representation of data in a lower-dimensional space that captures the relationships and similarities between different data points. It is commonly used in machine learning and natural language processing to transform high-dimensional data into a more compact and meaningful form, making it easier to analyze and process.',
            },
          ],
        },
        {
          prompt:
            'Answer this QUESTION "{question}" as a support engineer working for Nuclia. Be precise in your answer and stay polite.',
          results: [
            {
              model: 'chatgpt-azure',
              answer:
                "Dear User,\n\nThank you for reaching out to us at Nuclia. An embedding, in the context of machine learning, is a learned representation for some specific input data. These representations are typically in the form of a dense vector of floating point values. The key idea here is that similar inputs will have similar embeddings, meaning their numerical values will be close in the embedding space.\n\nFor example, in natural language processing, words with similar meanings are intended to be mapped to similar positions in the embedding space. These embeddings can capture complex relationships among words and their meanings.\n\nI hope this explanation helps! If you have any further questions or need additional clarification, please don't hesitate to ask.\n\nBest Regards,\n[Your Name]\nNuclia Support Engineer",
            },
            {
              model: 'chatgpt-azure-3',
              answer:
                'An embedding is a technique used in natural language processing and machine learning to represent words or phrases as numerical vectors. These vectors capture semantic and syntactic relationships between words, allowing algorithms to understand and process language more effectively. In the context of Nuclia, embeddings play a crucial role in enabling the platform to analyze and interpret user-generated content, providing valuable insights and enhancing the overall user experience. If you have any further questions or need assistance with embeddings, please feel free to ask.',
            },
          ],
        },
      ],
    },
  ];
  hasResults = new BehaviorSubject(true);
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

  deleteQuestion($index: number) {
    this.queries.splice($index, 1);
    this.updateConfigurationExpanderSize.next([...this.queries]);
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
          return this._generateResults(this.queries, [this.currentPrompt]);
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

  collapseAnswer(query: string) {
    this.queryCollapsed[query] = !this.queryCollapsed[query];
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
