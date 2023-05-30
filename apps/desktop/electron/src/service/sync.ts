import {
  addActiveSyncLog,
  addErrorLog,
  addLog,
  getLastModified,
  getSources,
  incrementActiveSyncLog,
  readPersistentData,
  removeActiveSyncLog,
  syncFile,
  updateSource,
} from './sources';
// import { importConnector, loadConnectors } from './dynamic-connectors';
import { delay, forkJoin, map, Observable, of, switchMap, tap } from 'rxjs';

export const sync = () => {
  // UNCOMMENT TO ENABLE DYNAMIC CONNECTORS
  // importConnector('https://nuclia.github.io/status/connectors/youtube.js');
  // loadConnectors();
  readPersistentData();
  try {
    syncFiles();
  } catch (error) {
    console.log('Sync failed', error);
  }
  collectLastModified();
};

function syncFiles() {
  let isSyncing = false;
  setInterval(() => {
    if (!isSyncing) {
      isSyncing = true;
      of(getSources())
        .pipe(
          switchMap((sources) => {
            const arr = Object.entries(sources).filter(
              ([, source]) => source.items && source.items.length > 0 && source.kb,
            );

            return arr.length === 0
              ? of(undefined)
              : forkJoin(
                  arr.map((idAndSource) =>
                    of(idAndSource).pipe(
                      tap(([id, source]) => {
                        console.log(`Syncing ${source.items?.length} items from ${id}`);
                        addActiveSyncLog(id, source);
                      }),
                      switchMap(([id, source]) => {
                        if (!source.kb || !source.items || source.items.length === 0) {
                          return of(undefined);
                        }

                        const batch: Observable<string | undefined>[] = source.items.slice(0, 10).map((item) =>
                          of(item).pipe(
                            switchMap((item) =>
                              syncFile(id, source, item).pipe(
                                tap((success) => {
                                  if (success) {
                                    incrementActiveSyncLog(id);
                                  }
                                }),
                                map((success) => (success ? item.originalId : undefined)),
                                // do not overwhelm the source
                                delay(500),
                              ),
                            ),
                          ),
                        );
                        return forkJoin(batch).pipe(
                          tap((result) => {
                            if (result) {
                              const successfullyUploaded = result.filter((originalId) => !!originalId);
                              const hasFailures = successfullyUploaded.length !== result.length;
                              source.items = (source.items || []).filter(
                                (item) => !successfullyUploaded.includes(item.originalId),
                              );
                              source.total = (source.total || 0) + successfullyUploaded.length;
                              addLog(
                                id,
                                source,
                                successfullyUploaded.length,
                                hasFailures ? `${result.length - successfullyUploaded.length} failures` : '',
                              );
                              if (successfullyUploaded.length > 0) {
                                updateSource(id, source);
                              }
                              removeActiveSyncLog(id);
                            }
                          }),
                        );
                      }),
                    ),
                  ),
                );
          }),
        )
        .subscribe(() => (isSyncing = false));
    }
  }, 5000);
}

let timer: any;
let isCollecting = false;

function collectLastModified() {
  function _collectLastModified() {
    if (!isCollecting) {
      isCollecting = true;
      of(getSources())
        .pipe(
          switchMap((sources) => {
            const arr = Object.entries(sources).filter(([, source]) => source.permanentSync);
            return arr.length === 0
              ? of(undefined)
              : of(...arr).pipe(
                  switchMap(([id, source]) =>
                    getLastModified(id, source.lastSyncGMT, source.folders).pipe(
                      tap((results) => {
                        if (results.success) {
                          const existing = source.items || [];
                          console.log(`Found ${results.results.length} new items from ${id}`);
                          source.items = [...existing, ...results.results];
                          source.lastSyncGMT = new Date().toISOString();
                          updateSource(id, source);
                        } else {
                          addErrorLog(id, source, results.error);
                          console.error(results.error);
                        }
                      }),
                    ),
                  ),
                );
          }),
        )
        .subscribe(() => (isCollecting = false));
    }
  }
  _collectLastModified();
  timer = setInterval(() => _collectLastModified(), 60 * 60 * 1000);
}

export function restartCollection() {
  if (!isCollecting) {
    if (timer) {
      clearInterval(timer);
    }
    collectLastModified();
  }
}
