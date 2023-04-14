import { getLastModified, getSources, readSources, syncFile, updateSource } from './sources';
import { importConnector, loadConnectors } from './dynamic-connectors';
import { concatMap, delay, map, of, switchMap, tap, toArray } from 'rxjs';

export const sync = () => {
  importConnector('https://nuclia.github.io/status/connectors/youtube.js');
  loadConnectors();
  readSources();
  try {
    syncFiles();
  } catch (error) {
    console.log('Sync failed', error);
  }
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
                  tap(([id, source]) => console.log(`Syncing ${source.items?.length} items from ${id}`)),
                  switchMap(([id, source]) => {
                    if (!source.kb || !source.items || source.items.length === 0) {
                      return of(undefined);
                    }
                    if (source.items.length !== source.lastBatch) {
                      updateSource(id, { ...source, lastBatch: source.items.length });
                    }
                    const batch = source.items.slice(0, 10);
                    return of(...batch).pipe(
                      concatMap((item) =>
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
                          source.total = (source.total || 0) + successfullyUploaded.length;
                          if (successfullyUploaded.length > 0) {
                            updateSource(id, source);
                          }
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
  function _collectLastModified() {
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
                    getLastModified(id, source.lastSync, source.folders).pipe(
                      tap((results) => {
                        if (results.success) {
                          const existing = source.items || [];
                          console.log(`Found ${results.results.length} new items from ${id}`);
                          source.items = [...existing, ...results.results];
                          source.lastSync = new Date().toISOString();
                          updateSource(id, source);
                        } else {
                          // TODO: log the error in history
                          console.error(results.error);
                        }
                      }),
                    ),
                  ),
                );
          }),
        )
        .subscribe(() => (running = false));
    }
  }
  _collectLastModified();
  setInterval(() => _collectLastModified(), 60 * 60 * 1000);
}
