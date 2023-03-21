import * as fs from 'fs';
import { of, switchMap, tap } from 'rxjs';
import { getConnector } from './connectors';
import { Source, SyncItem } from './models';
import { NucliaCloud } from './nuclia-cloud';

export const getSources: () => { [id: string]: Source } = () => {
  try {
    const data = fs.readFileSync('./connectors-db.json', 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.log(`Error reading file: ${err}`);
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

export const getSourceFiles = (sourceId: string, query?: string) => {
  const sources = getSources();
  const source = sources[sourceId];
  if (!source) {
    throw new Error('Source not found');
  }
  const connectorDefinition = getConnector(source.connectorId);
  const connector = connectorDefinition.factory();
  connector.setParameters(source.data);
  return connector.getFiles(query);
};

const downloadFile = (source: Source, item: SyncItem) => {
  const connectorDefinition = getConnector(source.connectorId);
  const connector = connectorDefinition.factory();
  connector.setParameters(source.data);
  return connector.download(item);
};

export const syncFile = (source: Source, item: SyncItem) => {
  if (!source.kb) {
    return of(undefined);
  }

  const nucliaConnector = new NucliaCloud(source.kb);
  console.log('Uploading', item);
  return downloadFile(source, item).pipe(
    tap((blob) => console.log('Downloaded', blob),
    // switchMap((blob) => nucliaConnector.upload(item.originalId, item.title, { blob })),
  );
};
