import { baseLogoPath, ConnectorDefinition, ConnectorParameters, IConnector, Section, SyncItem } from '../models';
import { Observable, of } from 'rxjs';

export const ConfluenceConnector: ConnectorDefinition = {
  id: 'confluence',
  title: 'Confluence',
  logo: `${baseLogoPath}/confluence.svg`,
  description: 'Collaboration platform developed by Atlassian',
  helpUrl: 'https://docs.nuclia.dev/docs/docs/using/sync-agent#confluence-connector-usage',
  deprecated: true,
  factory: () => new ConfluenceImpl(),
};

const TOKEN = 'CONFLUENCE_TOKEN';
class ConfluenceImpl implements IConnector {
  hasServerSideAuth = false;
  isExternal = false;
  allowToSelectFolders = true;
  canSyncSecurityGroups = false;

  getParametersSections(): Observable<Section[]> {
    return of([
      {
        id: 'account',
        title: 'sync.connectors.confluence.account.title',
        description: 'sync.connectors.confluence.account.description',
        fields: [
          {
            id: 'url',
            label: 'sync.connectors.confluence.url.label',
            type: 'text',
            placeholder: 'https://my-site.atlassian.net/wiki',
            required: true,
          },
          {
            id: 'user',
            label: 'sync.connectors.confluence.user.label',
            type: 'text',
            placeholder: 'me@mycompany.com',
            required: true,
          },
          {
            id: 'token',
            label: 'sync.connectors.confluence.token.label',
            type: 'text',
            required: true,
          },
        ],
      },
    ]);
  }

  handleParameters(params: ConnectorParameters) {
    localStorage.setItem(TOKEN, params['token']);
  }

  getParametersValues(): ConnectorParameters {
    return {
      token: localStorage.getItem(TOKEN),
    };
  }

  getStaticFolders(): SyncItem[] {
    return [];
  }
}
