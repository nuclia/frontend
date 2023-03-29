import * as fs from 'fs';
import { from, of, switchMap, tap } from 'rxjs';
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

export const getSource = (sourceId: string) => {
  const sources = getSources();
  return sources[sourceId];
};

export const getSourceFiles = (sourceId: string, query?: string) => {
  const source = getSource(sourceId);
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
    return of(false);
  }

  const nucliaConnector = new NucliaCloud(source.kb);
  return downloadFile(source, item).pipe(
    switchMap((blob) => from(blob.arrayBuffer())),
    switchMap((arrayBuffer) => nucliaConnector.upload(item.originalId, item.title, { buffer: arrayBuffer })),
  );
};
