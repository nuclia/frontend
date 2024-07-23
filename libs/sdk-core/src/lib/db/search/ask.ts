import { catchError, map, Observable, of, tap } from 'rxjs';
import type { IErrorResponse, INuclia } from '../../models';
import { Ask } from './ask.models';
import { ChatOptions } from './search.models';

import { ResourceProperties } from '../db.models';

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
    show: [ResourceProperties.BASIC, ResourceProperties.VALUES],
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
        map(({ answer, relations, retrieval_results, citations, learning_id, answer_json }) => {
          return {
            type: 'answer',
            text: answer,
            sources: { ...retrieval_results, relations },
            citations,
            incomplete: false,
            id: learning_id,
            jsonAnswer: answer_json,
          } as Ask.Answer;
        }),
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
          const jsonAnswerItem = items.find((response) => response.item.type === 'answer_json');
          let jsonAnswer: Ask.AnswerJsonResponseItem | undefined;
          if (jsonAnswerItem) {
            jsonAnswer = jsonAnswerItem.item as Ask.AnswerJsonResponseItem;
            if (!answer && typeof jsonAnswer.object['answer'] === 'string') {
              answer = jsonAnswer.object['answer'];
            }
          }

          return {
            type: 'answer',
            text: answer,
            sources,
            incomplete,
            id,
            citations,
            jsonAnswer: jsonAnswer?.object,
          } as Ask.Answer;
        }),
        catchError((error) =>
          of({ type: 'error', status: error.status, detail: error.detail || '' } as IErrorResponse),
        ),
        tap((res) => {
          nuclia.events?.log('lastResults', res);
          if (res.type === 'answer' && res.sources) {
            nuclia.currentShards = { ...nuclia.currentShards, [kbid]: res.sources.shards || [] };
          }
        }),
      );
}
