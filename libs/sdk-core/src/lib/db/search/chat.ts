import { catchError, map, Observable, of } from 'rxjs';
import type { IErrorResponse, INuclia } from '../../models';
import { Chat } from './chat.models';
import type { BaseSearchOptions, Search } from './search.models';
import { ResourceProperties } from '../kb';

const END_OF_SEARCH_RESULTS = '_END_';

export function chat(
  nuclia: INuclia,
  path: string,
  query: string,
  context: Chat.ContextEntry[] = [],
  features: Chat.Features[] = [Chat.Features.PARAGRAPHS],
  options: BaseSearchOptions = {},
): Observable<Chat.Answer | IErrorResponse> {
  let sourcesLength = 0;
  let sources: Search.FindResults | undefined;
  let relations: Search.Relations | undefined;
  let text = '';
  return nuclia.rest
    .getStream(`${path}/chat`, {
      query,
      context,
      show: [ResourceProperties.BASIC, ResourceProperties.VALUES],
      features: features.length > 0 ? features : undefined,
      ...options,
    })
    .pipe(
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
      catchError((error) => of({ type: 'error', status: error.status, detail: error.detail || '' } as IErrorResponse)),
    );
}
