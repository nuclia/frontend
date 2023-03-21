import { map, Observable, takeWhile } from 'rxjs';
import type { INuclia } from '../../models';
import type { Chat } from './chat.models';
import type { Search } from './search.models';

const END_OF_STREAM = '_END_';

export function chat(
  nuclia: INuclia,
  path: string,
  query: string,
  context: Chat.Entry[] = [],
  features: Chat.Features[] = [],
): Observable<Chat.Answer> {
  let sourcesLength = 0;
  let sources: Search.FindResults | undefined;
  let text = '';
  let end = false;
  return nuclia.rest.getStream(`${path}/chat`, { query, context, features }).pipe(
    map((data) => {
      if (sourcesLength === 0 && data.length >= 4) {
        sourcesLength = new DataView(data.buffer.slice(0, 4)).getUint32(0);
      }
      if (!sources && sourcesLength > 0 && data.length > sourcesLength + 4) {
        const sourcesData = data.slice(4, sourcesLength + 4);
        sources = JSON.parse(atob(new TextDecoder().decode(sourcesData.buffer)));
      }
      if (sources && data.length > sourcesLength + 4) {
        text = new TextDecoder().decode(data.slice(sourcesLength + 4).buffer);
        end = text.includes(END_OF_STREAM);
        if (end) {
          text = text.split(END_OF_STREAM)[0];
        }
      }
      return { text, sources, incomplete: !end };
    }),
    takeWhile((answer) => answer.incomplete),
  );
}
