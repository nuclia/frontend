import { baseLogoPath, ConnectorParameters, Field, IConnector, ConnectorDefinition, SyncItem } from '../models';
import { Observable, of } from 'rxjs';

export const ConfluenceConnector: ConnectorDefinition = {
  id: 'confluence',
  title: 'Confluence',
  logo: `${baseLogoPath}/confluence.svg`,
  description: 'Collaboration platform developed by Atlassian',
  helpUrl: 'https://docs.nuclia.dev/docs/docs/using/sync-agent#confluence-connector-usage',
  factory: () => of(new ConfluenceImpl()),
};

const TOKEN = 'CONFLUENCE_TOKEN';
class ConfluenceImpl implements IConnector {
  hasServerSideAuth = false;
  isExternal = false;
  allowToSelectFolders = true;
  canSyncSecurityGroups = false;

  getParameters(): Observable<Field[]> {
    return of([
      {
        id: 'url',
        label: 'connectors.confluence.url.label',
        type: 'text',
        placeholder: 'https://my-site.atlassian.net/wiki',
        required: true,
      },
      {
        id: 'user',
        label: 'connectors.confluence.user.label',
        type: 'text',
        placeholder: 'me@mycompany.com',
        required: true,
      },
      {
        id: 'token',
        label: 'connectors.confluence.token.label',
        type: 'text',
        required: true,
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

  goToOAuth(redirect: string, reset?: boolean) {
    return of(true);
  }

  cleanAuthData() {
    throw new Error('Method not implemented.');
  }

  authenticate(): Observable<boolean> {
    return of(!!this.getParametersValues()['token']);
  }

  getStaticFolders(): SyncItem[] {
    return [];
  }
}
