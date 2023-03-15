import * as fs from 'fs';
import { getConnector } from './connectors';
import { Source } from './models';

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
