import { catchError, from, map, Observable, of, switchMap, tap } from 'rxjs';
import type { IErrorResponse, INuclia } from '../../models';
import { Ask, PredictAnswerOptions } from './ask.models';
import { ChatOptions, Search } from './search.models';

import { ResourceProperties } from '../db.models';

const ERROR_CODES: { [key: string]: number } = {
  success: 0,
  error: -1,
  no_context: -2,
  no_retrieval_data: -3,
};

export function ask(
  nuclia: INuclia,
  kbid: string,
  path: string,
  query: string,
  context: Ask.ContextEntry[] = [],
  features: Ask.Features[] = [Ask.Features.SEMANTIC, Ask.Features.KEYWORD],
  options: ChatOptions = {},
): Observable<Ask.Answer | IErrorResponse> {
  const { synchronous, show_consumption, ...searchOptions } = options;
  const noEmptyValues = Object.entries(searchOptions).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (acc as any)[key] = value;
    }
    return acc;
  }, {} as ChatOptions);
  const endpoint = `${path}/ask`;
  const body = {
    query,
    context,
    show: searchOptions.show || [ResourceProperties.BASIC, ResourceProperties.VALUES],
    features: features.length > 0 ? features : undefined,
    ...noEmptyValues,
  };
  const extraHeaders = show_consumption ? { 'x-show-consumption': 'true' } : undefined;
  nuclia.events?.log('lastQuery', {
    endpoint,
    params: body,
    headers: {
      ...nuclia.rest.getHeaders('POST', endpoint, {}, synchronous),
      ...extraHeaders,
    },
    nucliaOptions: nuclia.options,
  });
  return synchronous
    ? nuclia.rest.post<Ask.AskResponse>(endpoint, body, extraHeaders, undefined, true).pipe(
        map(
          ({
            answer,
            relations,
            retrieval_results,
            citations,
            citation_footnote_to_context,
            learning_id,
            answer_json,
            status,
            error_details,
            metadata,
            prompt_context,
            augmented_context,
            reasoning,
            consumption,
          }) => {
            if (status !== 'success' && !canIgnoreStatus(status, body, !!retrieval_results)) {
              return {
                type: 'error',
                status: ERROR_CODES[status] || -1,
                detail: error_details || '',
              } as IErrorResponse;
            }
            return {
              type: 'answer',
              text: answer,
              sources: { ...retrieval_results, relations },
              citations,
              citation_footnote_to_context,
              incomplete: false,
              id: learning_id,
              jsonAnswer: answer_json,
              metadata,
              promptContext: prompt_context,
              augmentedContext: augmented_context,
              reasoning,
              consumption,
            } as Ask.Answer;
          },
        ),
        tap((res) => nuclia.events?.log('lastResults', res)),
      )
    : nuclia.rest.getStreamedResponse(endpoint, body, extraHeaders).pipe(
        map(({ data, incomplete, headers }) => {
          const searchId = headers.get('X-Nuclia-Trace-Id') || '';
          const id = headers.get('NUCLIA-LEARNING-ID') || '';
          let previous = '';
          const rows = new TextDecoder()
            .decode(data.buffer)
            .split('\n')
            .filter((d) => d);
          const items: Ask.AskResponseItem[] = rows.reduce((acc, row) => {
            previous += row;
            try {
              const obj = JSON.parse(previous) as Ask.AskResponseItem;
              acc.push(obj);
              previous = '';
            } catch (e) {
              // block is not complete yet
            }
            return acc;
          }, [] as Ask.AskResponseItem[]);

          const statusItem = items.find((item) => item.item.type === 'status');
          if (statusItem) {
            const item = statusItem.item as Ask.StatusAskResponseItem;
            const status = parseInt(item.code, 10);
            const hasResults = items.some((item) => item.item.type === 'retrieval');
            if (!Number.isNaN(status) && status !== 0 && !canIgnoreStatus(item.status, body, hasResults)) {
              return { type: 'error', status, detail: item.details || '' } as IErrorResponse;
            }
          }
          let answer = items
            .filter((item) => item.item.type === 'answer')
            .map((item) => (item.item as Ask.AnswerAskResponseItem).text)
            .join('');
          let reasoning = items
            .filter((item) => item.item.type === 'reasoning')
            .map((item) => (item.item as Ask.ReasoningAskResponseItem).text)
            .join('');
          const sourcesItem = items.find((item) => item.item.type === 'retrieval');
          const sources = sourcesItem ? (sourcesItem.item as Ask.RetrievalAskResponseItem).results : undefined;
          if (sources) {
            sources.searchId = searchId;
          }
          const citationsItem = items.find((item) => item.item.type === 'citations');
          const citations = citationsItem ? (citationsItem.item as Ask.CitationsAskResponseItem).citations : undefined;
          const citationFootnotesItem = items.find((item) => item.item.type === 'footnote_citations');
          const citation_footnote_to_context = citationFootnotesItem
            ? (citationFootnotesItem.item as Ask.CitationFootnotesAskResponseItem).footnote_to_context
            : undefined;
          const prequeriesItem = items.find((item) => item.item.type === 'prequeries');
          const prequeries: { [key: string]: Omit<Search.FindResults, 'type'> } | undefined = prequeriesItem
            ? (prequeriesItem.item as Ask.PrequeriesResponseItem).results
            : undefined;

          const jsonAnswerItem = items.find((response) => response.item.type === 'answer_json');
          let jsonAnswer: Ask.AnswerJsonResponseItem | undefined;
          if (jsonAnswerItem) {
            jsonAnswer = jsonAnswerItem.item as Ask.AnswerJsonResponseItem;
            if (!answer && typeof jsonAnswer.object['answer'] === 'string') {
              answer = jsonAnswer.object['answer'];
            }
          }
          const metadataItem = items.find((item) => item.item.type === 'metadata');
          const metadata = metadataItem
            ? {
                timings: (metadataItem.item as Ask.MetadataAskResponseItem).timings,
                tokens: (metadataItem.item as Ask.MetadataAskResponseItem).tokens,
              }
            : undefined;
          const consumptionItem = items.find((item) => item.item.type === 'consumption');
          const consumption = consumptionItem
            ? {
                customer_key_tokens: (consumptionItem.item as Ask.ConsumptionAskResponseItem).customer_key_tokens,
                normalized_tokens: (consumptionItem.item as Ask.ConsumptionAskResponseItem).normalized_tokens,
              }
            : undefined;
          const debugItem = items.find((item) => item.item.type === 'debug');
          const promptContext = debugItem
            ? (debugItem.item as Ask.DebugAskResponseItem).metadata?.['prompt_context']
            : undefined;
          const augmentedContextItem = items.find((item) => item.item.type === 'augmented_context');
          const augmentedContext = augmentedContextItem
            ? (augmentedContextItem.item as Ask.AugmentedContextAskResponseItem).augmented
            : undefined;

          return {
            type: 'answer',
            text: answer,
            sources,
            incomplete,
            id,
            citations,
            citation_footnote_to_context,
            prequeries,
            jsonAnswer: jsonAnswer?.object,
            metadata,
            promptContext,
            augmentedContext,
            reasoning,
            consumption,
          } as Ask.Answer;
        }),
        catchError((error) =>
          of({ type: 'error', status: error.status, detail: error.detail || error.details || '' } as IErrorResponse),
        ),
        tap((res) => {
          nuclia.events?.log('lastResults', res);
        }),
      );
}

export function predictAnswer(
  nuclia: INuclia,
  path: string,
  question: string,
  options: PredictAnswerOptions = {},
  synchronous?: boolean,
): Observable<Ask.Answer | IErrorResponse> {
  const endpoint = `${path}/predict/chat`;
  const body = { question, user_id: Ask.Author.USER, ...options };
  const extraHeaders: { [key: string]: string } = synchronous ? {} : { accept: 'application/x-ndjson' };
  nuclia.events?.log('lastQuery', {
    endpoint,
    params: body,
    headers: nuclia.rest.getHeaders('POST', endpoint, extraHeaders, synchronous),
    nucliaOptions: nuclia.options,
  });
  return (
    synchronous
      ? nuclia.rest.post<Response>(endpoint, body, extraHeaders, true).pipe(
          switchMap((res) => {
            const id = res.headers.get('nuclia-learning-id') || '';
            return from(res.text()).pipe(
              map((text) => {
                if (options?.json_schema) {
                  const rows = text.split('\n').filter((d) => d);
                  return rows.reduce(
                    (acc, row) => {
                      const obj = JSON.parse(row).chunk;
                      if (obj.type === 'object') {
                        acc.jsonAnswer = obj.object;
                      }
                      if (obj.type === 'status') {
                        acc.status = parseInt(obj.code);
                      }
                      return acc;
                    },
                    { id, answer: '' } as { id: string; answer: string; jsonAnswer: object; status: number },
                  );
                } else {
                  return { id, answer: text.slice(0, -1), jsonAnswer: undefined, status: parseInt(text.slice(-1)) };
                }
              }),
            );
          }),
          map(({ id, answer, jsonAnswer, status }) => {
            if (!Number.isNaN(status) && status !== 0) {
              return { type: 'error', status, detail: answer } as IErrorResponse;
            }
            return {
              type: 'answer',
              id,
              text: answer,
              jsonAnswer,
              incomplete: false,
              inError: false,
            } as Ask.Answer;
          }),
        )
      : nuclia.rest.getStreamedResponse(endpoint, body, extraHeaders).pipe(
          map(({ data, incomplete, headers }) => {
            const id = headers.get('nuclia-learning-id') || '';
            let previous = '';
            const rows = new TextDecoder()
              .decode(data.buffer)
              .split('\n')
              .filter((d) => d);
            const items = rows.reduce((acc, row) => {
              previous += row;
              try {
                const obj = JSON.parse(previous) as Ask.PredictAnswerResponseItem;
                acc.push(obj);
                previous = '';
              } catch (e) {
                // block is not complete yet
              }
              return acc;
            }, [] as Ask.PredictAnswerResponseItem[]);
            const statusItem = items.find((item) => item.chunk.type === 'status');
            if (statusItem) {
              const item = statusItem.chunk as Ask.StatusPredictAnswerResponseItem;
              const status = parseInt(item.code, 10);
              if (!Number.isNaN(status) && status !== 0) {
                return { type: 'error', status } as IErrorResponse;
              }
            }
            const jsonAnswerItem = items.find((item) => item.chunk.type === 'object');
            const jsonAnswer = jsonAnswerItem
              ? (jsonAnswerItem.chunk as Ask.JsonPredictAnswerResponseItem).object
              : undefined;
            const text = items
              .filter((item) => item.chunk.type === 'text')
              .map((item) => (item.chunk as Ask.TextPredictAnswerResponseItem).text)
              .join('');
            let reasoning = items
              .filter((item) => item.chunk.type === 'reasoning')
              .map((item) => (item.chunk as Ask.ReasoningAskResponseItem).text)
              .join('');
            return {
              type: 'answer',
              id,
              text,
              jsonAnswer,
              incomplete,
              inError: false,
              reasoning,
            } as Ask.Answer;
          }),
        )
  ).pipe(
    catchError((error) => of({ type: 'error', status: error.status, detail: error.detail || '' } as IErrorResponse)),
    tap((res) => nuclia.events?.log('lastResults', res)),
  );
}

function canIgnoreStatus(status: string, options: ChatOptions, hasResults: boolean) {
  // When response generation is disabled, the error status should be ignored in order to return the search results.
  return status === 'error' && options.generative_model === 'generative-multilingual-2023' && hasResults;
}
