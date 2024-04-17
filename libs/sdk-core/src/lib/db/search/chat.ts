import { catchError, map, Observable, of, tap } from 'rxjs';
import type { IErrorResponse, INuclia } from '../../models';
import { Chat, Citations } from './chat.models';
import { ChatOptions, Search } from './search.models';

import { ResourceProperties } from '../db.models';

const END_OF_SEARCH_RESULTS = '_END_';
const START_OF_CITATIONS = '_CIT_';

export function chat(
  nuclia: INuclia,
  kbid: string,
  path: string,
  query: string,
  context: Chat.ContextEntry[] = [],
  features: Chat.Features[] = [Chat.Features.VECTORS, Chat.Features.PARAGRAPHS],
  options: ChatOptions = {},
): Observable<Chat.Answer | IErrorResponse> {
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
  const endpoint = `${path}/chat`;
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
    ? nuclia.rest
        .post<{ answer: string; relations: Search.Relations; results: Search.FindResults; citations: Citations }>(
          endpoint,
          body,
          undefined,
          undefined,
          true,
        )
        .pipe(
          map(({ answer, relations, results, citations }) => {
            return {
              type: 'answer',
              text: answer,
              sources: { ...results, relations },
              citations,
              incomplete: false,
              id: '',
            } as Chat.Answer;
          }),
          tap((res) => nuclia.events?.log('lastResults', res)),
        )
    : nuclia.rest.getStreamedResponse(endpoint, body).pipe(
        map(({ data, incomplete, headers }) => {
          const searchId = headers.get('X-Nuclia-Trace-Id') || '';
          const id = headers.get('NUCLIA-LEARNING-ID') || '';
          // /chat returns a readable stream structured as follows:
          // - 1st block: 4 first bytes indicates the size of the 2nd block
          // - 2nd block: a base64 encoded JSON containing the sources used to build the answer
          // - 3rd block: the answer text, ended by "_CIT_" (or "_END_" if no citations)
          // - 4th block (optional):
          //      - 4 first bytes indicates the size of the block,
          //      - followed by a base64 encoded JSON containing the citations
          //      - ended by "_END_"
          // - 5th block (optional): base64 encoded JSON containing the relations
          if (sourcesLength === 0 && data.length >= 4) {
            sourcesLength = new DataView(data.buffer.slice(0, 4)).getUint32(0);
          }
          if (!sources && sourcesLength > 0 && data.length > sourcesLength + 4) {
            const sourcesData = data.slice(4, sourcesLength + 4);
            sources = JSON.parse(atob(new TextDecoder().decode(sourcesData.buffer)));
          }
          if (sources) {
            sources.searchId = searchId;
          }
          if (sources && data.length > sourcesLength + 4) {
            text = new TextDecoder().decode(data.slice(sourcesLength + 4).buffer);
            if (text.includes(END_OF_SEARCH_RESULTS)) {
              let relationsBase64;
              [text, relationsBase64] = text.split(END_OF_SEARCH_RESULTS);
              if (text.includes(START_OF_CITATIONS)) {
                let citationsBlock;
                [text, citationsBlock] = text.split(START_OF_CITATIONS);
                const citationsBase64 = citationsBlock.slice(4); // remove the 4 first bytes indicating the size of the block
                try {
                  citations = JSON.parse(atob(citationsBase64));
                } catch (e) {
                  // block is not complete yet
                }
              }
              if (relationsBase64) {
                try {
                  relations = JSON.parse(atob(relationsBase64));
                  sources.relations = relations;
                } catch (e) {
                  // block is not complete yet
                }
              }
            }
          }
          return { type: 'answer', text, sources, incomplete, id, citations } as Chat.Answer;
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
