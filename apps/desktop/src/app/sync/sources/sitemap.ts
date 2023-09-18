import { baseLogoPath, ConnectorParameters, Field, ISourceConnector, SourceConnectorDefinition } from '../models';
import { Observable, of } from 'rxjs';

export const SitemapConnector: SourceConnectorDefinition = {
  id: 'sitemap',
  title: 'Sitemap',
  logo: `${baseLogoPath}/sitemap.svg`,
  description: 'Upload web pages from a sitemap.xml',
  permanentSyncOnly: true,
  factory: () => of(new SitemapImpl()),
};

class SitemapImpl implements ISourceConnector {
  hasServerSideAuth = false;
  isExternal = true;

  getParameters(): Observable<Field[]> {
    return of([
      {
        id: 'sitemap',
        label: 'Sitemap URL',
        type: 'text',
        required: true,
        pattern: /.+\.(ashx|xml)/,
        placeholder: 'https://my-website.com/sitemap.xml',
      },
    ]);
  }

  handleParameters(params: ConnectorParameters) {
    // eslint-disable-next-line no-empty-function
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
