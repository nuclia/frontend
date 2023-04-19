import * as fs from 'fs';
import path from 'path';
import { catchError, from, map, Observable, of, switchMap, tap } from 'rxjs';
import { getConnector } from './connectors';
import { Source, SyncItem } from './models';
import { NucliaCloud } from './nuclia-cloud';

let SOURCES: { [id: string]: Source } = {};

export const getSources: () => { [id: string]: Source } = () => {
  return SOURCES;
};

export const setSources = (sources: { [id: string]: Source }) => {
  SOURCES = sources;
};

export const updateSource = (id: string, source: Source) => {
  SOURCES[id] = source;
};

export const getSource = (sourceId: string) => {
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

export const getSourceFiles = (sourceId: string, query?: string) => {
  const connector = getSourceInstance(sourceId);
  connector;
  return connector.getFiles(query).pipe(
    catchError((err) => {
      return connector.refreshAuthentication().pipe(
        tap((success) => {
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
};

export const getSourceFolders = (sourceId: string, query?: string) => {
  const connector = getSourceInstance(sourceId);
  return connector.getFolders(query).pipe(
    catchError((err) => {
      return connector.refreshAuthentication().pipe(
        tap((success) => {
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
};

function downloadFileOrLink(
  sourceId: string,
  item: SyncItem,
): Observable<{ type: 'blob' | 'link'; blob?: Blob; link?: any }> {
  const connector = getSourceInstance(sourceId);
  if (connector.isExternal) {
    return connector.getLink(item).pipe(map((link) => ({ type: 'link', link })));
  } else {
    return connector.download(item).pipe(map((blob) => ({ type: 'blob', blob })));
  }
}

export function syncFile(sourceId: string, source: Source, item: SyncItem): Observable<boolean> {
  if (!source.kb) {
    return of(false);
  }

  const nucliaConnector = new NucliaCloud(source.kb);
  return downloadFileOrLink(sourceId, item).pipe(
    switchMap((data) => {
      if (data.type === 'blob' && data.blob) {
        return from(data.blob.arrayBuffer()).pipe(
          switchMap((arrayBuffer) => {
            try {
              return nucliaConnector.upload(item.originalId, item.title, { buffer: arrayBuffer });
            } catch (err) {
              return of(false);
            }
          }),
        );
      } else if (data.type === 'link' && data.link) {
        return nucliaConnector.uploadLink(item.title, data.link).pipe(map(() => true));
      } else {
        return of(false);
      }
    }),
    tap((success) =>
      success
        ? console.log(`Uploaded ${item.originalId} with success`)
        : console.log(`Failed to upload ${item.originalId}`),
    ),
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
      catchError((err) => {
        // TODO: log the error in history
        console.error(`Error on ${sourceId}: ${err.message}`);
        return of([]);
      }),
      map((results) => ({ success: true, results })),
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
  const connector = connectorDefinition.factory();
  connector.setParameters(source.data);
  return connector;
};

function getDataPath(): string {
  switch (process.platform) {
    case 'darwin': {
      return path.join(process.env.HOME || '.', 'Library', 'Application Support', 'nuclia', 'connectors-db.json');
    }
    case 'win32': {
      return path.join(process.env.APPDATA || '.', 'nuclia', 'connectors-db.json');
    }
    case 'linux': {
      return path.join(process.env.HOME || '.', '.nuclia', 'connectors-db.json');
    }
    default: {
      return '.';
    }
  }
}

export function getSourceFromBody(data: any, existingFiles: SyncItem[]): Source {
  const source = data as unknown as Source;
  if (source.permanentSync) {
    source.folders = [...(source.items || [])];
    source.items = [...existingFiles];
  }
  return source;
}

export function readSources() {
  try {
    const data = fs.readFileSync(getDataPath(), 'utf8');
    SOURCES = JSON.parse(data);
  } catch (err) {
    console.error(`Error reading file: ${err}`);
  }
  //do something when app is closing
  process.on('exit', exitHandler);
  //catches ctrl+c event
  process.on('SIGINT', exitHandler);
}

function exitHandler() {
  try {
    fs.writeFileSync(getDataPath(), JSON.stringify(SOURCES));
  } catch (err) {
    console.error(`Error writing file: ${err}`);
    throw err;
  }
  console.log('Exit now');
  process.exit();
}
