import * as fs from 'fs';
import { catchError, concatMap, from, map, Observable, of, switchMap, tap } from 'rxjs';
import { getConnector } from './connectors';
import { LogRow, SearchResults, Source, SyncItem } from './models';
import { NucliaCloud } from './nuclia-cloud';
import { getDataPath } from './utils';
import { TextField } from '@nuclia/core';

let SOURCES: { [id: string]: Source } = {};
let LOG: LogRow[] = [];
const ACTIVE_SYNC: { [id: string]: LogRow } = {};

export const getSources: () => { [id: string]: Source } = () => {
  return SOURCES;
};

export const setSources = (sources: { [id: string]: Source }) => {
  SOURCES = sources;
};

export const updateSource = (id: string, source: Source) => {
  SOURCES[id] = source;
};

export const deleteSource = (id: string) => {
  delete SOURCES[id];
};

export const getSource: (sourceId: string) => Source = (sourceId: string) => {
  const sources = getSources();
  return sources[sourceId];
};

export const hasAuth = (sourceId: string) => {
  try {
    const connector = getSourceInstance(sourceId);
    return connector.hasAuthData();
  } catch (err) {
    console.error(`Error on ${sourceId} when reading auth data: ${err.message}`);
    return false;
  }
};

export function getSourceFiles(sourceId: string, query?: string): Observable<SearchResults> {
  const connector = getSourceInstance(sourceId);
  connector;
  return connector.getFiles(query).pipe(
    catchError((err) => {
      return connector.refreshAuthentication().pipe(
        concatMap((success) => {
          if (success) {
            const source = getSource(sourceId);
            source.data = connector.getParameters();
            updateSource(sourceId, source);
            return connector.getFiles(query);
          } else {
            throw new Error('Failed to refresh authentication');
          }
        }),
      );
    }),
  );
}

export function getSourceFolders(sourceId: string, query?: string): Observable<SearchResults> {
  const connector = getSourceInstance(sourceId);
  return connector.getFolders(query).pipe(
    catchError((err) => {
      return connector.refreshAuthentication().pipe(
        concatMap((success) => {
          if (success) {
            const source = getSource(sourceId);
            source.data = connector.getParameters();
            updateSource(sourceId, source);
            return connector.getFolders(query);
          } else {
            throw new Error('Failed to refresh authentication');
          }
        }),
      );
    }),
  );
}

function downloadFileOrLink(
  sourceId: string,
  item: SyncItem,
): Observable<{ type: 'blob' | 'link' | 'text'; blob?: Blob; link?: any; text?: TextField }> {
  const connector = getSourceInstance(sourceId);
  if (connector.isExternal) {
    return connector.getLink(item).pipe(map((link) => ({ type: 'link', link })));
  } else {
    return connector
      .download(item)
      .pipe(map((res) => (res instanceof Blob ? { type: 'blob', blob: res } : { type: 'text', text: res })));
  }
}

export function syncFile(
  sourceId: string,
  source: Source,
  item: SyncItem,
): Observable<{ success: boolean; message?: string }> {
  if (!source.kb) {
    return of({ success: false });
  }

  const nucliaConnector = new NucliaCloud(source.kb);
  return downloadFileOrLink(sourceId, item).pipe(
    switchMap((data) => {
      try {
        if (data.type === 'blob' && data.blob) {
          return from(data.blob.arrayBuffer()).pipe(
            switchMap((arrayBuffer) => {
              return nucliaConnector.upload(item.originalId, item.title, {
                buffer: arrayBuffer,
                metadata: { ...item.metadata, labels: source.labels },
              });
            }),
          );
        } else if (data.type === 'text' && data.text) {
          return nucliaConnector.upload(item.originalId, item.title, {
            text: data.text,
            metadata: { labels: source.labels },
          });
        } else if (data.type === 'link' && data.link) {
          return nucliaConnector
            .uploadLink(item.originalId, item.title, data.link)
            .pipe(map(() => ({ success: true, message: '' })));
        } else {
          return of({ success: false, message: '' });
        }
      } catch (err) {
        return of({ success: false, message: `${err}` });
      }
    }),
    tap((res) => {
      if (res.success) {
        console.log(`Uploaded ${item.originalId} with success`);
      } else {
        console.warn(`Failed to upload ${item.originalId}`);
        addErrorLog(sourceId, source.kb?.knowledgeBox, res.message || 'Failed to upload file');
      }
    }),
  );
}

export function getLastModified(
  sourceId: string,
  sinceGMT?: string,
  folders?: SyncItem[],
): Observable<{ success: boolean; results: SyncItem[]; error?: string }> {
  const connector = getSourceInstance(sourceId);
  try {
    return connector.getLastModified(sinceGMT || '2000-01-01T00:00:00.000Z', folders).pipe(
      map((results) => ({ success: true, results })),
      catchError((err) => {
        console.error(`Error on ${sourceId}: ${err.message}`);
        return of({ success: false, results: [], error: `${err}` });
      }),
    );
  } catch (err) {
    return of({ success: false, results: [], error: `${err}` });
  }
}

const getSourceInstance = (sourceId: string) => {
  const source = getSource(sourceId);
  if (!source) {
    throw new Error('Source not found');
  }
  const connectorDefinition = getConnector(source.connectorId);
  if (!connectorDefinition) {
    throw new Error(`Connector ${source.connectorId} not defined`);
  }
  const connector = connectorDefinition.factory();
  connector.setParameters(source.data);
  return connector;
};

export function getSourceFromBody(source: Source, existingFiles: SyncItem[]): Source {
  if (source.permanentSync) {
    source.folders = [...(source.items || [])];
    source.items = [...existingFiles];
  }
  return source;
}

export function getLogs(since?: string): LogRow[] {
  return since ? LOG.filter((log) => log.date > since) : LOG;
}

export function clearLogs() {
  LOG = [];
}

export function addLog(id: string, source: Source, count: number, errors: string) {
  LOG.push({
    from: id,
    to: source.kb?.knowledgeBox || 'Unknown kb',
    errors,
    progress: 100,
    started: true,
    completed: true,
    date: new Date().toISOString(),
    total: count,
  });
}

export function addErrorLog(sourceId: string, kbId?: string, error?: string) {
  LOG.push({
    from: sourceId,
    to: kbId || 'Unknown kb',
    errors: error || 'Unknown error',
    progress: 100,
    started: true,
    completed: true,
    date: new Date().toISOString(),
    total: 0,
  });
}

export function getActiveSyncs(): { [id: string]: LogRow } {
  return ACTIVE_SYNC;
}

export function addActiveSyncLog(id: string, source: Source) {
  ACTIVE_SYNC[id] = {
    from: id,
    to: source.kb?.knowledgeBox || 'Unknown kb',
    errors: '',
    progress: 0,
    started: true,
    completed: false,
    date: new Date().toISOString(),
    total: source.items?.length || 0,
  };
}

export function incrementActiveSyncLog(id: string) {
  const existing = ACTIVE_SYNC[id];
  if (existing) {
    ACTIVE_SYNC[id] = { ...existing, progress: existing.progress + 1 };
  }
}

export function removeActiveSyncLog(id: string) {
  delete ACTIVE_SYNC[id];
}

export function readPersistentData() {
  try {
    const path = getDataPath('connectors-db.json');
    const data = fs.readFileSync(path, 'utf8');
    console.log(`Reading from ${path}`);
    SOURCES = JSON.parse(data);
  } catch (err) {
    console.error(`Error reading connectors-db.json file: ${err}`);
  }
  try {
    const data = fs.readFileSync(getDataPath('connectors-log.json'), 'utf8');
    LOG = JSON.parse(data);
  } catch (err) {
    console.error(`Error reading connectors-log.json file: ${err}`);
  }

  //save files on exit
  process.on('exit', exitHandler);
  process.on('SIGTERM', exitHandler);
  //catches ctrl+c event
  process.on('SIGINT', exitHandler);
}

export function saveFiles() {
  try {
    fs.writeFileSync(getDataPath('connectors-db.json'), JSON.stringify(SOURCES));
  } catch (err) {
    console.error(`Error writing connectors-db.json file: ${err}`);
    throw err;
  }
  try {
    if (LOG.length > 1000) {
      // if longer than 1000 entries, we keep the last 100 and save the rest in a separate file
      const past = LOG.slice(0, LOG.length - 100);
      const recent = LOG.slice(LOG.length - 100);
      fs.writeFileSync(getDataPath(`connectors-log-${new Date().toISOString()}.json`), JSON.stringify(past));
      fs.writeFileSync(getDataPath('connectors-log.json'), JSON.stringify(recent));
    } else {
      fs.writeFileSync(getDataPath('connectors-log.json'), JSON.stringify(LOG));
    }
  } catch (err) {
    console.error(`Error writing connectors-log.json file: ${err}`);
    throw err;
  }
}

function exitHandler() {
  saveFiles();
  console.log('Exit now');
  process.exit();
}
