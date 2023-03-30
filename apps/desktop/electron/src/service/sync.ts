import { getLastModified, getSources, setSources, syncFile } from './sources';
import { importConnector, loadConnectors } from './dynamic-connectors';
import { delay, forkJoin, map, of, switchMap, tap, toArray } from 'rxjs';
import { FileStatus } from './models';

export const sync = () => {
  importConnector('https://nuclia.github.io/status/connectors/youtube.js');
  loadConnectors();
  syncFiles();
  collectLastModified();
};

function syncFiles() {
  let running = false;
  setInterval(() => {
    if (!running) {
      running = true;
      of(getSources())
        .pipe(
          switchMap((sources) => {
            const arr = Object.entries(sources).filter(
              ([id, source]) => source.items && source.items.length > 0 && source.kb,
            );
            return arr.length === 0
              ? of(undefined)
              : of(...arr).pipe(
                  switchMap(([id, source]) => {
                    if (!source.kb || !source.items || source.items.length === 0) {
                      return of(undefined);
                    }
                    return of(...source.items.slice(0, 10)).pipe(
                      switchMap((item) =>
                        syncFile(id, source, item).pipe(
                          map((success) => (success ? item.originalId : undefined)),
                          // do not overwhelm the source
                          delay(500),
                          toArray(),
                        ),
                      ),
                      tap((result) => {
                        if (result) {
                          const successfullyUploaded = result.filter((originalId) => !!originalId);
                          source.items = (source.items || []).filter(
                            (item) => !successfullyUploaded.includes(item.originalId),
                          );
                          const updated = { ...sources, [id]: source };
                          setSources(updated);
                        }
                      }),
                    );
                  }),
                );
          }),
        )
        .subscribe(() => (running = false));
    }
  }, 5000);
}

function collectLastModified() {
  let running = false;
  setInterval(() => {
    if (!running) {
      running = true;
      of(getSources())
        .pipe(
          switchMap((sources) => {
            const arr = Object.entries(sources).filter(([id, source]) => source.permanentSync);
            return arr.length === 0
              ? of(undefined)
              : of(...arr).pipe(
                  switchMap(([id, source]) =>
                    getLastModified(id, source.lastSync).pipe(
                      tap((results) => {
                        const existing = source.items || [];
                        source.items = [...existing, ...results];
                        source.lastSync = new Date().toISOString();
                        const updated = { ...sources, [id]: source };
                        setSources(updated);
                      }),
                    ),
                  ),
                );
          }),
        )
        .subscribe(() => (running = false));
    }
  }, 60 * 60 * 1000);
}
