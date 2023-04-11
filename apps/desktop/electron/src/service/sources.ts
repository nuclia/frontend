import * as fs from 'fs';
import path from 'path';
import { from, map, Observable, of, switchMap, tap } from 'rxjs';
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

export const getSourceFiles = (sourceId: string, query?: string) => {
  const connector = getSourceInstance(sourceId);
  return connector.getFiles(query);
};

const downloadFile = (sourceId: string, item: SyncItem) => {
  const connector = getSourceInstance(sourceId);
  return connector.download(item);
};

export const syncFile = (sourceId: string, source: Source, item: SyncItem) => {
  if (!source.kb) {
    return of(false);
  }

  const nucliaConnector = new NucliaCloud(source.kb);
  return downloadFile(sourceId, item).pipe(
    switchMap((blob) =>
      blob
        ? from(blob.arrayBuffer()).pipe(
            switchMap((arrayBuffer) => nucliaConnector.upload(item.originalId, item.title, { buffer: arrayBuffer })),
          )
        : of(false),
    ),
    tap((success) => console.log(`Uploaded ${item.originalId} to ${source.kb} with success: ${success}`)),
  );
};

export function getLastModified(
  sourceId: string,
  since?: string,
): Observable<{ success: boolean; results: SyncItem[]; error?: string }> {
  const connector = getSourceInstance(sourceId);
  try {
    return connector
      .getLastModified(since || '2000-01-01T00:00:00.000Z')
      .pipe(map((results) => ({ success: true, results })));
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
  //catches uncaught exceptions
  // process.on('uncaughtException', exitHandler);
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
