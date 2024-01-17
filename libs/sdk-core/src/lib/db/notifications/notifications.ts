import type { INuclia } from '../../models';
import { map, Observable } from 'rxjs';
import { NotificationMessage } from './notification.models';

export function getAllNotifications(
  nuclia: INuclia,
  path: string,
  controller: AbortController,
): Observable<NotificationMessage[]> {
  return nuclia.rest.getStreamMessages(`${path}/notifications`, controller).pipe(
    map(({ data }) => {
      const decoded = new TextDecoder().decode(data);
      return decoded
        .split('\n')
        .filter((line) => !!line)
        .map((line) => JSON.parse(line));
    }),
  );
}
