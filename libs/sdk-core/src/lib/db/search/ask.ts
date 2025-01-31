import { catchError, map, Observable, of, tap } from 'rxjs';
import type { IErrorResponse, INuclia } from '../../models';
import { Ask } from './ask.models';
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
  const { synchronous, ...searchOptions } = options;
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
  body['shards'] = nuclia.currentShards?.[kbid] || [];
  nuclia.events?.log('lastQuery', {
    endpoint,
    params: body,
    headers: nuclia.rest.getHeaders('POST', endpoint, {}, synchronous),
    nucliaOptions: nuclia.options,
  });
  return synchronous
    ? nuclia.rest.post<Ask.AskResponse>(endpoint, body, undefined, undefined, true).pipe(
        map(
          ({
            answer,
            relations,
            retrieval_results,
            citations,
            learning_id,
            answer_json,
            status,
            error_details,
            metadata,
            prompt_context,
          }) => {
            if (status !== 'success') {
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
              incomplete: false,
              id: learning_id,
              jsonAnswer: answer_json,
              metadata,
              promptContext: prompt_context,
            } as Ask.Answer;
          },
        ),
        tap((res) => nuclia.events?.log('lastResults', res)),
      )
    : nuclia.rest.getStreamedResponse(endpoint, body).pipe(
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
            if (!Number.isNaN(status) && status < 1) {
              return { type: 'error', status, detail: item.details || '' } as IErrorResponse;
            }
          }
          let answer = items
            .filter((item) => item.item.type === 'answer')
            .map((item) => (item.item as Ask.AnswerAskResponseItem).text)
            .join('');
          const sourcesItem = items.find((item) => item.item.type === 'retrieval');
          const sources = sourcesItem ? (sourcesItem.item as Ask.RetrievalAskResponseItem).results : undefined;
          if (sources) {
            sources.searchId = searchId;
          }
          const citationsItem = items.find((item) => item.item.type === 'citations');
          const citations = citationsItem ? (citationsItem.item as Ask.CitationsAskResponseItem).citations : undefined;
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
          const debugItem = items.find((item) => item.item.type === 'debug');
          const promptContext = debugItem
            ? (debugItem.item as Ask.DebugAskResponseItem).metadata?.['prompt_context']
            : undefined;

          return {
            type: 'answer',
            text: answer,
            sources,
            incomplete,
            id,
            citations,
            prequeries,
            jsonAnswer: jsonAnswer?.object,
            metadata,
            promptContext,
          } as Ask.Answer;
        }),
        catchError((error) =>
          of({ type: 'error', status: error.status, detail: error.detail || error.details || '' } as IErrorResponse),
        ),
        tap((res) => {
          nuclia.events?.log('lastResults', res);
          if (res.type === 'answer' && res.sources) {
            nuclia.currentShards = { ...nuclia.currentShards, [kbid]: res.sources.shards || [] };
          }
        }),
      );
}
