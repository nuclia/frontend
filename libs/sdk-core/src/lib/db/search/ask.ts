import { catchError, map, Observable, of, tap } from 'rxjs';
import type { IErrorResponse, INuclia } from '../../models';
import { Ask, AskResponseItem, Citations } from './ask.models';
import { ChatOptions, Search } from './search.models';

import { ResourceProperties } from '../db.models';
import { chat } from './chat';

const END_OF_SEARCH_RESULTS = '_END_';
const START_OF_CITATIONS = '_CIT_';

export function ask(
  nuclia: INuclia,
  kbid: string,
  path: string,
  query: string,
  context: Ask.ContextEntry[] = [],
  features: Ask.Features[] = [Ask.Features.VECTORS, Ask.Features.PARAGRAPHS],
  options: ChatOptions = {},
): Observable<Ask.Answer | IErrorResponse> {
  // TO BE REMOVED WHEN ask is fully deployed
  if (nuclia.options.backend !== 'https://stashify.cloud/api') {
    return chat(nuclia, kbid, path, query, context, features, options);
  }
  let sourcesLength = 0;
  let sources: Search.FindResults | undefined;
  let relations: Search.Relations | undefined;
  let citations: Citations | undefined;
  let text = '';
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
  nuclia.events?.log('lastQuery', { endpoint, params: body, nucliaOptions: nuclia.options });
  return synchronous
    ? nuclia.rest.post<Ask.AskResponse>(endpoint, body, undefined, undefined, true).pipe(
        map(({ answer, relations, retrieval_results, citations, learning_id }) => {
          return {
            type: 'answer',
            text: answer,
            sources: { ...retrieval_results, relations },
            citations,
            incomplete: false,
            id: learning_id,
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
          const items: AskResponseItem[] = rows.reduce((acc, row) => {
            previous += row;
            try {
              const obj = JSON.parse(previous) as AskResponseItem;
              acc.push(obj);
              previous = '';
            } catch (e) {
              // block is not complete yet
            }
            return acc;
          }, [] as AskResponseItem[]);

          const text = items
            .filter((item) => item.item.type === 'answer')
            .map((item) => (item.item as Ask.AnswerAskResponseItem).text)
            .join('');
          const sources = items.find((item) => item.item.type === 'retrieval')?.item.results;
          const citations = items.find((item) => item.item.type === 'citations')?.item.citations;
          if (sources) {
            sources.searchId = searchId;
          }
          return { type: 'answer', text, sources, incomplete, id, citations } as Ask.Answer;
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
