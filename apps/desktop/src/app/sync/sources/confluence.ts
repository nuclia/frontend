import { ISourceConnector, SourceConnectorDefinition, Field, ConnectorParameters } from '../models';
import { Observable, of } from 'rxjs';

export const ConfluenceConnector: SourceConnectorDefinition = {
  id: 'confluence',
  title: 'Confluence',
  logo: 'assets/logos/confluence.svg',
  description: 'Collaboration platform developed by Atlassian',
  helpUrl: 'https://docs.nuclia.dev/docs/batch/nda#confluence-connector-usage',
  factory: () => of(new ConfluenceImpl()),
};

const TOKEN = 'CONFLUENCE_TOKEN';
class ConfluenceImpl implements ISourceConnector {
  hasServerSideAuth = false;
  isExternal = false;

  getParameters(): Observable<Field[]> {
    return of([
      {
        id: 'url',
        label: 'Confluence site URL',
        type: 'text',
        placeholder: 'https://my-site.atlassian.net/wiki',
        required: true,
      },
      {
        id: 'user',
        label: 'User account',
        type: 'text',
        placeholder: 'me@mycompany.com',
        required: true,
      },
      {
        id: 'token',
        label: 'API token',
        type: 'text',
        required: true,
      },
    ]);
  }

  handleParameters(params: ConnectorParameters) {
    localStorage.setItem(TOKEN, params.token);
  }

  getParametersValues(): ConnectorParameters {
    return {
      token: localStorage.getItem(TOKEN),
    };
  }

  goToOAuth(reset?: boolean) {
    return of(true);
  }

  authenticate(): Observable<boolean> {
    return of(!!this.getParametersValues().token);
  }
}
