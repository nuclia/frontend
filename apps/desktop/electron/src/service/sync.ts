import { getSources, setSources, syncFile } from './sources';
import { importConnector, loadConnectors } from './dynamic-connectors';
import { forkJoin, of, switchMap, tap } from 'rxjs';
import { FileStatus } from './models';

export const sync = () => {
  importConnector('https://nuclia.github.io/status/connectors/youtube.js');
  loadConnectors();
  let running = false;
  setInterval(() => {
    if (!running) {
      running = true;
      of(getSources())
        .pipe(
          switchMap((sources) => {
            const arr = Object.entries(sources);
            return arr.length === 0
              ? of(undefined)
              : of(...arr).pipe(
                  switchMap(([id, source]) => {
                    if (!source.kb) {
                      return of(undefined);
                    }
                    return forkJoin(
                      (source.items || []).map((item) =>
                        syncFile(source, item).pipe(
                          tap((success) => {
                            if (success) {
                              item.status = FileStatus.UPLOADED;
                            }
                          }),
                        ),
                      ),
                    ).pipe(
                      tap(() => {
                        source.items = (source.items || []).filter((item) => item.status !== FileStatus.UPLOADED);
                        const updated = { ...sources, [id]: source };
                        setSources(updated);
                      }),
                    );
                  }),
                );
          }),
        )
        .subscribe(() => (running = false));
    }
  }, 5000);
};
