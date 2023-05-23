import { ISourceConnector, SourceConnectorDefinition, Field, ConnectorParameters } from '../models';
import { Observable, of } from 'rxjs';

export const SitemapConnector: SourceConnectorDefinition = {
  id: 'sitemap',
  title: 'Sitemap',
  logo: 'assets/logos/sitemap.svg',
  description: 'Upload web pages from a sitemap.xml',
  factory: () => of(new SitemapImpl()),
};

class SitemapImpl implements ISourceConnector {
  hasServerSideAuth = false;
  isExternal = true;
  url = '';

  getParameters(): Observable<Field[]> {
    return of([
      {
        id: 'sitemap',
        label: 'Sitemap URL',
        type: 'text',
        required: true,
      },
    ]);
  }

  handleParameters(params: ConnectorParameters) {
    if (params['url']) {
      this.url = params['url'];
    }
  }

  getParametersValues(): ConnectorParameters {
    return {
      path: this.url,
    };
  }

  goToOAuth() {
    // eslint-disable-next-line no-empty-function
  }

  authenticate(): Observable<boolean> {
    return of(true);
  }
}
