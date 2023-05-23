import { DropboxConnector } from './connectors/dropbox';
import { FolderConnector } from './connectors/folder';
import { OneDriveConnector } from './connectors/onedrive';
import { SharepointConnector } from './connectors/sharepoint';
import { SourceConnectorDefinition } from './models';

const connectors: { [id: string]: SourceConnectorDefinition } = {
  dropbox: DropboxConnector,
  onedrive: OneDriveConnector,
  folder: FolderConnector,
  sharepoint: SharepointConnector,
};

// TODO: add the dynamic connectors

export const getConnector = (id: string) => {
  return connectors[id];
};
