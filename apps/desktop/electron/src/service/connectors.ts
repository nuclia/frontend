import { DropboxConnector } from './connectors/dropbox';
import { SourceConnectorDefinition } from './models';

const connectors: { [id: string]: SourceConnectorDefinition } = {
  dropbox: DropboxConnector,
};

// TODO: add the dynamic connectors

export const getConnector = (id: string) => {
  return connectors[id];
};
