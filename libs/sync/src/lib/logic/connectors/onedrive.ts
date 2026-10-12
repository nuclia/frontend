import { OAuthConnector } from './oauth';

export const ONEDRIVE_CONNECTOR_ID = 'onedrive-me';

/**
 * Dedicated "OneDrive" connector tile. Backed by the same Azure OAuth connection and
 * Graph API as SharePoint, but always browses the user's personal drive (site "me"),
 * so it never shows the SharePoint site-URL step or the certificate-credentials form.
 */
export class OneDriveImpl extends OAuthConnector {
  override allowToSelectFolders = true;

  constructor(id: string, path: string) {
    super(ONEDRIVE_CONNECTOR_ID, id, path);
  }
}
