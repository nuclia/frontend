import { Observable, Subject, catchError, filter, forkJoin, from, map, of, switchMap, take } from 'rxjs';
import { ChatOptions, Search, SearchOptions } from './search.models';
import { KnowledgeBox } from '../kb';
import { Ask } from './ask.models';

const VARIABLES = new RegExp(/{{([^}]+)}}/g);

/** Agentic RAG
 * 
 * The Agentic class allows to define a pipeline of actions to be executed in sequence.
 * Each action can be of different types:
 * - predict: ask a question to the LLM model and extract information in a JSON response
 * - find: search for a set of results based on a query
 * - ask: perform a Nuclia RAG call based on a query
 * - web: fetch a web page and extract information based on CSS selectors
 * - api: call an API and extract information based on a JSON path
 * - user: wait for a user entry
 * 
 * Example:
 * ```typescript
 *   const agentic = nucliaApi.knowledgeBox.createAgenticRAGPipeline({
    START: {
      action: {
        type: 'predict',
        query: 'Does the following question refers to a specific reference document? QUESTION: "{{query}}"',
        outputs: {
          reference: {
            type: 'string',
            description: 'The name of the reference document if any, and just an empty string if none.',
          },
        },
      },
      next: [
        { stepId: 'finddoc', if: '`{{START.reference}}` !== ""' },
        { stepId: 'domain', if: '`{{START.reference}}` == ""' },
      ],
    },
    finddoc: {
      action: {
        type: 'find',
        query: '{{START.reference}}',
        features: [Search.Features.KEYWORD],
        options: {
          fields: ['a/title'],
        },
      },
      next: [{ stepId: 'domain' }],
    },
    domain: {
      action: {
        type: 'predict',
        query:
          'What is the domain of the question among the following categories: "ART", "SCIENCE" ? QUESTION: "{{query}}"',
        outputs: {
          domain: { type: 'string', description: 'The domain of the question.' },
        },
      },
      next: [{ stepId: 'answer' }],
    },
    answer: {
      action: {
        type: 'ask',
        query: '{{query}}',
        options: {
          filters: ['/classification.labels/domain/{{domain.domain}}'],
          resource_filters: ['{{finddoc.results.resources.[0].id}}'],
        },
      },
    },
  });
  agentic
    .run({
      query,
    })
    .subscribe((res) => console.log(agentic.context));
  agentic.status.subscribe((res) => console.log(res));
  * ```
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Agentic {
  export interface Output {
    type: 'string' | 'number' | 'boolean';
    description: string;
    required?: boolean;
  }
  export interface OutputArray {
    type: 'array';
    items: Output;
    required?: boolean;
  }
  export interface PredictAction {
    type: 'predict';
    query: string;
    context?: string[];
    outputs: { [id: string]: Output | OutputArray };
  }
  export interface FindAction {
    type: 'find';
    query: string;
    features?: Search.Features[];
    options: SearchOptions;
  }
  export interface AskAction {
    type: 'ask';
    query: string;
    features?: Ask.Features[];
    options?: ChatOptions;
    outputs?: { [id: string]: Output | OutputArray };
  }
  export interface WebAction {
    type: 'web';
    url: string;
    headers?: { [id: string]: string };
    // outputs defined as CSS selectors
    outputs: { [id: string]: string };
  }
  export interface APIAction {
    type: 'api';
    url: string;
    method: 'GET' | 'POST';
    headers?: { [id: string]: string };
    body?: any;
    // outputs defined as path in the JSON structure
    outputs: { [id: string]: string };
  }

  export interface UserEventAction {
    type: 'user';
    label: string;
    help?: string;
    inputType: 'boolean' | 'choice' | 'text';
  }

  export type Action = PredictAction | FindAction | AskAction | WebAction | APIAction | UserEventAction;

  export interface Step {
    action: Action;
    next?: { if?: string; stepId: string }[];
    statusMessage?: string;
  }

  export interface Event {
    stepId: string;
    status: 'running' | 'done' | 'error';
    message?: string;
  }

  export type Steps = { [stepId: string]: Step };

  export class Pipeline {
    kb: KnowledgeBox;
    steps: { [stepId: string]: Step };
    context: { [id: string]: any } = {};
    private _events = new Subject<{ stepId: string; params: UserEventAction }>();
    events = this._events.asObservable();
    userResponses = new Subject<{ stepId: string; value: boolean | string | string[] }>();
    private _status = new Subject<Event>();
    status = this._status.asObservable();

    constructor(
      private _kb: KnowledgeBox,
      private _steps: Steps,
    ) {
      this.kb = _kb;
      this.steps = _steps;
    }

    run(initialContext: object): Observable<boolean> {
      this.context = initialContext;
      return this.runStep('START');
    }

    private runStep(stepId: string): Observable<boolean> {
      const step = this.steps[stepId];
      if (!step) {
        return of(false);
      }
      this._status.next({ stepId, status: 'running' });
      return this.runSingleStep(stepId).pipe(
        switchMap((success) => {
          if (success) {
            const message = step.statusMessage ? this.format(step.statusMessage) : '';
            this._status.next({ stepId, status: 'done', message });
            const nextSteps = (step.next || [])
              .filter((step) => !step.if || this.eval<boolean>(step.if))
              .map((next) => next.stepId);

            return nextSteps.length === 0
              ? of(true)
              : forkJoin(nextSteps.map((nextStepId) => this.runStep(nextStepId).pipe(take(1)))).pipe(
                  map((results) => results.every((r) => r)),
                );
          } else {
            this._status.next({ stepId, status: 'error' });
            return of(false);
          }
        }),
      );
    }

    private runSingleStep(stepId: string): Observable<boolean> {
      const step = this.steps[stepId];
      if (!step) {
        return of(false);
      }
      switch (step.action.type) {
        case 'predict':
          return this.runPredictAction(stepId, step.action);
        case 'find':
          return this.runFindAction(stepId, step.action);
        case 'ask':
          return this.runAskAction(stepId, step.action);
        case 'web':
          return this.runWebAction(stepId, step.action);
        case 'api':
          return this.runAPIAction(stepId, step.action);
        case 'user':
          return this.runUserAction(stepId, step.action);
        default:
          return of(false);
      }
    }

    private runPredictAction(stepId: string, action: PredictAction): Observable<boolean> {
      const json_schema = {
        name: 'answer',
        parameters: {
          type: 'object',
          properties: action.outputs,
          required: Object.entries(action.outputs)
            .filter(([_, v]) => v.required)
            .map(([k, _]) => k),
        },
      };
      return this.kb.generateJSON(this.format(action.query) || '', json_schema, this.formatObject(action.context)).pipe(
        map((res) => {
          this.context = { ...this.context, [stepId]: res.answer };
          return res.success;
        }),
      );
    }

    private runFindAction(stepId: string, action: FindAction): Observable<boolean> {
      return this.kb
        .find(
          this.format(action.query) || '',
          action.features || [Search.Features.SEMANTIC, Search.Features.KEYWORD],
          this.formatObject(action.options),
        )
        .pipe(
          map((res) => {
            if (res.type !== 'findResults') {
              return false;
            } else {
              this.context = { ...this.context, [stepId]: { results: res } };
              return true;
            }
          }),
        );
    }

    private runAskAction(stepId: string, action: AskAction): Observable<boolean> {
      const json_schema = action.outputs
        ? {
            name: 'answer',
            parameters: {
              type: 'object',
              properties: action.outputs,
              required: Object.keys(action.outputs),
            },
          }
        : undefined;
      return this.kb
        .ask(this.format(action.query) || '', [], action.features, {
          ...this.formatObject(action.options),
          synchronous: true,
          answer_json_schema: json_schema,
        })
        .pipe(
          map((res) => {
            if (res.type !== 'answer') {
              return false;
            } else {
              const outputs = res.jsonAnswer || {};
              this.context = { ...this.context, [stepId]: { results: res, ...outputs } };
              return true;
            }
          }),
        );
    }

    private runWebAction(stepId: string, action: WebAction): Observable<boolean> {
      const url = this.format(action.url);
      if (!url) {
        return of(false);
      }
      return from(
        fetch(url, {
          headers: this.formatObject(action.headers),
        })
          .then((res) => res.text())
          .then((html) => {
            const doc = new DOMParser().parseFromString(html, 'text/xml');
            const outputs = Object.entries(action.outputs).reduce(
              (acc, [key, selector]) => {
                acc[key] = doc.querySelector(selector)?.textContent || '';
                return acc;
              },
              {} as { [id: string]: string },
            );
            this.context = { ...this.context, [stepId]: outputs };
            return true;
          }),
      ).pipe(catchError(() => of(false)));
    }

    private runAPIAction(stepId: string, action: APIAction): Observable<boolean> {
      const url = this.format(action.url);
      if (!url) {
        return of(false);
      }
      return from(
        fetch(url, {
          method: action.method,
          headers: this.formatObject(action.headers),
          body: action.body ? JSON.stringify(this.formatObject(action.body)) : undefined,
        })
          .then((res) => res.json())
          .then((data) => {
            const outputs = Object.entries(action.outputs).reduce(
              (acc, [key, path]) => {
                path = this.format(path) || '';
                if (path) {
                  acc[key] = this.getObjectValue(data, path);
                }
                return acc;
              },
              {} as { [id: string]: any },
            );
            this.context = { ...this.context, [stepId]: outputs };
            return true;
          }),
      ).pipe(catchError(() => of(false)));
    }

    private runUserAction(stepId: string, action: UserEventAction): Observable<boolean> {
      this._events.next({ stepId, params: this.formatObject(action) });
      return this.userResponses.pipe(
        filter((event) => event.stepId === stepId),
        map((event) => {
          this.context = { ...this.context, [stepId]: event.value };
          return true;
        }),
      );
    }

    /*
    Return the value of a nested object property according a given path.
    Example:
    const obj = { a: { b: { c: 1 }, d: [23, 78, 'abc'] } };
    getObjectValue(obj, 'a.b') // { c: 1 }
    getObjectValue(obj, 'a.b.c') // 1
    getObjectValue(obj, 'a.d.[2]') // 'abc'
    Indexes can also be used on dictionaries, getting the n-th value of the dictionary:
    getObjectValue(obj, 'a.[0]') // { c: 1 }
    */
    private getObjectValue(obj: object, path: string): any {
      if (!obj) {
        return undefined;
      }
      const keys = path.split('.');
      return keys.reduce((acc, key) => {
        if (!acc) {
          return undefined;
        }
        if (key.startsWith('[')) {
          key = key.replace('[', '').replace(']', '');
          if (Array.isArray(acc)) {
            try {
              const index = parseInt(key, 10);
              return acc[index];
            } catch (e) {
              return undefined;
            }
          } else {
            if (acc[key]) {
              return acc[key];
            } else {
              try {
                const index = parseInt(key, 10);
                return Object.values(acc)[index];
              } catch (e) {
                return undefined;
              }
            }
          }
        } else if (acc[key]) {
          return acc[key];
        } else {
          return undefined;
        }
      }, obj as any);
    }

    /*
    Format a string expression by replacing {{variables}} with their values.
    The variables are evaluated as path on the global context.
    It is used to inject context data in the steps parameters.
    Example:
    this.context = {step1: {movie: 'The Matrix'}, step2: {actor: 'Keanu Reeves'}};
    format('The main actor of {{step1.movie}} is {{step2.actor}}') // 'The main actor of The Matrix is Keanu Reeves'
    */
    private format(expression: string, skipMissing = true): string | undefined {
      let missing = false;
      const formatted = expression.replace(VARIABLES, (match, p1) => {
        const value = this.getObjectValue(this.context, p1 as string);
        if (value === undefined) {
          missing = true;
        }
        return value !== undefined ? `${value}` : '';
      });
      return missing && skipMissing ? undefined : formatted;
    }

    /*
    Format an object by replacing {{variables}} with their values recursively in all the object properties.
    Applied to steps properties that are objects or arrays.
    */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private formatObject(obj: any): any {
      if (typeof obj === 'string') {
        return this.format(obj);
      } else if (Array.isArray(obj)) {
        const arr = obj.map((item) => this.formatObject(item)).filter((item) => item !== undefined);
        return arr.length > 0 ? arr : undefined;
      } else if (typeof obj === 'object') {
        return Object.entries(obj).reduce((acc, [key, value]) => {
          const formatted = this.formatObject(value);
          acc[key] = formatted;

          return acc;
        }, obj);
      } else {
        return obj;
      }
    }

    /*
    Evaluate a string expression as a JavaScript code.
    The string might contain {{variables}}.
    It is used to evaluate conditions in the steps next property.
    Example:
    this.context = {step1: {movie: 'The Matrix'}, step2: {actor: 'Keanu Reeves'}};
    eval('"{{step1.movie}}" === "The Matrix"') // true
    */
    private eval<T>(expression: string): T | undefined {
      const expr = this.format(expression, false);
      if (!expr) {
        return undefined;
      }
      try {
        return eval(expr) as T;
      } catch (e) {
        console.error(expr);
        console.error(e);
        return undefined;
      }
    }
  }
}
