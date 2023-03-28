import { getSources, syncFile } from './sources';
import { importConnector, loadConnectors } from './dynamic-connectors';
import { delay, forkJoin, of, repeat, switchMap, tap } from 'rxjs';
import { FileStatus } from './models';

export const sync = () => {
  importConnector('https://nuclia.github.io/status/connectors/youtube.js');
  loadConnectors();
  of(getSources())
    .pipe(
      switchMap((sources) => {
        const arr = Object.values(sources);
        return arr.length === 0
          ? of(undefined)
          : of(...arr).pipe(
              switchMap((source) => {
                if (!source.kb) {
                  console.log('No KB configured for source', source);
                  return of(undefined);
                }
                return forkJoin(
                  (source.items || []).map((item) =>
                    syncFile(source, item).pipe(tap(() => (item.status = FileStatus.UPLOADED))),
                  ),
                ).pipe(
                  tap(() => {
                    // source.items = (source.items || []).filter((item) => item.status === FileStatus.UPLOADED);
                  }),
                );
              }),
            );
      }),
      delay(5000),
      repeat(),
    )
    .subscribe();
};
