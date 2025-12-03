import {
  baseLogoPath,
  ConnectorDefinition,
  ConnectorParameters,
  FileStatus,
  IConnector,
  Section,
  SyncItem,
} from '../models';
import { Observable, of } from 'rxjs';

export const SitefinityConnector: ConnectorDefinition = {
  id: 'sitefinity',
  title: 'Sitefinity',
  logo: `${baseLogoPath}/sitefinity.svg`,
  description: 'Progress Sitefinity CMS',
  permanentSyncOnly: true,
  factory: () => new SitefinityImpl(),
};

class SitefinityImpl implements IConnector {
  hasServerSideAuth = false;
  isExternal = true;
  allowToSelectFolders = false;
  canSyncSecurityGroups = false;

  getStaticFolders(): SyncItem[] {
    return [
      {
        uuid: '',
        title: 'Sitefinity',
        originalId: 'SITEFINITY',
        metadata: {},
        status: FileStatus.PENDING,
      },
    ];
  }

  getParametersSections(): Observable<Section[]> {
    return of([
      {
        id: 'url',
        title: 'sync.connectors.sitefinity.url.section-title',
        fields: [
          {
            id: 'url',
            label: 'sync.connectors.sitefinity.url.label',
            type: 'text',
            required: true,
            placeholder: 'https://my-website.com',
          },
          {
            id: 'apikey',
            label: 'sync.connectors.sitefinity.apikey.label',
            type: 'text',
            required: true,
            help: 'sync.connectors.sitefinity.apikey.help',
          },
          {
            id: 'siteId',
            label: 'sync.connectors.sitefinity.site-id.label',
            type: 'text',
            required: true,
            help: 'sync.connectors.sitefinity.site-id.help',
          },
          {
            id: 'extraContentTypes',
            label: 'sync.connectors.sitefinity.extra.label',
            type: 'text',
            required: false,
            help: 'sync.connectors.sitefinity.extra.help',
          },
        ],
      },
    ]);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleParameters(params: ConnectorParameters) {
    return;
  }

  cleanAuthData() {
    throw new Error('Method not implemented.');
  }

  getParametersValues(): ConnectorParameters {
    return {};
  }

  goToOAuth() {
    // eslint-disable-next-line no-empty-function
  }

  authenticate(): Observable<boolean> {
    return of(true);
  }
}
