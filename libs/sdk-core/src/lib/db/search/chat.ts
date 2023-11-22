import { catchError, map, Observable, of, switchMap } from 'rxjs';
import type { IErrorResponse, INuclia } from '../../models';
import { Chat } from './chat.models';
import { ChatOptions, Search } from './search.models';

import { ResourceProperties } from '../db.models';
import { find } from './search';

const END_OF_SEARCH_RESULTS = '_END_';

export function chat(
  nuclia: INuclia,
  path: string,
  query: string,
  context: Chat.ContextEntry[] = [],
  features: Chat.Features[] = [Chat.Features.VECTORS, Chat.Features.PARAGRAPHS],
  options: ChatOptions = {},
): Observable<Chat.Answer | IErrorResponse> {
  let sourcesLength = 0;
  let sources: Search.FindResults | undefined;
  let relations: Search.Relations | undefined;
  let text = '';
  const { synchronous, answerRelatedResultsOnly, ...searchOptions } = options;
  if (!answerRelatedResultsOnly || !answerRelatedResultsOnly.enabled) {
    const endpoint = `${path}/chat`;
    const body = {
      query,
      context,
      show: [ResourceProperties.BASIC, ResourceProperties.VALUES],
      features: features.length > 0 ? features : undefined,
      ...searchOptions,
    };
    return synchronous
      ? nuclia.rest
          .post<{ answer: string; relations: Search.Relations; results: Search.FindResults }>(
            endpoint,
            body,
            undefined,
            undefined,
            true,
          )
          .pipe(
            map(({ answer, relations, results }) => {
              return {
                type: 'answer',
                text: answer,
                sources: { ...results, relations },
                incomplete: false,
                id: '',
              } as Chat.Answer;
            }),
          )
      : nuclia.rest.getStream(endpoint, body).pipe(
          map(({ data, incomplete, headers }) => {
            const searchId = headers.get('X-Nuclia-Trace-Id') || '';
            const id = headers.get('NUCLIA-LEARNING-ID') || '';
            // /chat returns a readable stream structured as follows:
            // - 1st block: 4 first bytes indicates the size of the 2nd block
            // - 2nd block: a base64 encoded JSON containing the sources used to build the answer
            // - 3rd block: the answer text, ended by "_END_"
            // - 4th block (optionally): base64 encoded JSON containing the entities
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
                if (relationsBase64) {
                  try {
                    relations = JSON.parse(atob(relationsBase64));
                    sources.relations = relations;
                  } catch (e) {
                    console.warn(e);
                  }
                }
              }
            }
            return { type: 'answer', text, sources, incomplete, id } as Chat.Answer;
          }),
          catchError((error) =>
            of({ type: 'error', status: error.status, detail: error.detail || '' } as IErrorResponse),
          ),
        );
  } else {
    // this is experimental, it will be done internally in the /chat endpoint itself in the future
    const kbid = path.split('/').pop() || '';
    const searchFeatures = [];
    if (features.includes(Chat.Features.PARAGRAPHS)) {
      searchFeatures.push(Search.Features.PARAGRAPH);
    }
    if (features.includes(Chat.Features.VECTORS)) {
      searchFeatures.push(Search.Features.VECTOR);
    }
    return find(nuclia, kbid, path, query, searchFeatures, searchOptions).pipe(
      switchMap((results) => {
        if (results.type === 'findResults') {
          const resourceMapping = Object.values(results.resources || {}).reduce(
            (acc, curr, index) => {
              const shortId = `${index + 1}`;
              acc[curr.id] = shortId;
              acc[shortId] = curr.id;
              return acc;
            },
            {} as { [key: string]: string },
          );
          const paragraphs = Object.values(results.resources || [])
            .map((r) =>
              Object.values(r.fields).map((f) =>
                Object.values(f.paragraphs).map(
                  (p) => `Content: ${p.text}\nInternal source reference: ${resourceMapping[r.id]}\n\n`,
                ),
              ),
            )
            .flat()
            .flat();
          const completeQuery = `${query}. At the end of the answer, add all the corresponding nInternal source references as a comma separated list formatted like this: INTERNAL SOURCES: 1, 2, 13\n\nDO NOT mention the internal source references when phrasing the answer itself.`;
          console.log('completeQuery', completeQuery);
          console.log('paragraphs', paragraphs);
          return nuclia.db.predictAnswer(completeQuery, paragraphs, answerRelatedResultsOnly.model).pipe(
            map((res) => {
              const answer = res.split('INTERNAL SOURCES:')[0];
              console.log('answer', answer);
              const ids = (res.split('INTERNAL SOURCES:')?.[1] || '')
                .split('\n')[0]
                .split(',')
                .map((id) => resourceMapping[id.trim()] || '');
              console.log('ids', ids);
              const matchingResources = Object.values(results.resources || {})
                .filter((r) => ids.includes(r.id))
                .reduce(
                  (acc, curr) => {
                    acc[curr.id] = curr;
                    return acc;
                  },
                  {} as { [id: string]: Search.FindResource },
                );
              return {
                type: 'answer',
                text: answer,
                id: 'N/A',
                sources: { ...results, resources: matchingResources },
              } as Chat.Answer;
            }),
          );
        } else {
          return of(results as IErrorResponse);
        }
      }),
    );
  }
}
