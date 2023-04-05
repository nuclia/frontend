import * as fs from 'fs';
import { from, map, Observable, of, switchMap, tap } from 'rxjs';
import { getConnector } from './connectors';
import { Source, SyncItem } from './models';
import { NucliaCloud } from './nuclia-cloud';

export const getSources: () => { [id: string]: Source } = () => {
  try {
    const data = fs.readFileSync('./connectors-db.json', 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.log(`Error reading file: ${err}`);
    return {};
  }
};

export const setSources = (sources: { [id: string]: Source }) => {
  try {
    fs.writeFileSync('./connectors-db.json', JSON.stringify(sources));
  } catch (err) {
    console.log(`Error writing file: ${err}`);
    throw err;
  }
};

export const updateSource = (id: string, source: Source) => {
  const sources = getSources();
  sources[id] = source;
  setSources(sources);
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
  );
};

export function getLastModified(
  sourceId: string,
  since?: string,
): Observable<{ success: boolean; results: SyncItem[]; error?: string }> {
  console.log('getLastModified', sourceId, since);
  const connector = getSourceInstance(sourceId);
  try {
    return connector.getLastModified(since || '2000-01-01T00:00:00.000Z').pipe(
      map((results) => ({ success: true, results })),
      tap((results) => {
        console.log('getLastModified', results);
      }),
    );
  } catch (err) {
    console.log('getLastModified', err);
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
