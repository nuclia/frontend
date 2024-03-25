import { baseLogoPath, ConnectorParameters, Field, IConnector, ConnectorDefinition } from '../models';
import { Observable, of } from 'rxjs';
import { FileStatus, SyncItem } from '../models';

export const RSSConnector: ConnectorDefinition = {
  id: 'rss',
  title: 'RSS',
  logo: `${baseLogoPath}/rss.svg`,
  description: 'Upload web pages from a RSS feed',
  permanentSyncOnly: true,
  factory: () => of(new RSSImpl()),
};

class RSSImpl implements IConnector {
  hasServerSideAuth = false;
  isExternal = true;
  allowToSelectFolders = false;

  getStaticFolders(): SyncItem[] {
    return [
      {
        uuid: '',
        title: 'RSS',
        originalId: 'rss',
        metadata: {},
        status: FileStatus.PENDING,
      },
    ];
  }

  getParameters(): Observable<Field[]> {
    return of([
      {
        id: 'url',
        label: 'connectors.rss.url.label',
        type: 'text',
        required: true,
        placeholder: 'https://rss-feed-url',
      },
      {
        id: 'cssSelector',
        label: 'connectors.sitemap.selector.label',
        help: 'connectors.sitemap.selector.help',
        type: 'text',
        required: false,
        placeholder: '.main-content',
      },
    ]);
  }

  handleParameters(params: ConnectorParameters) {
    // eslint-disable-next-line no-empty-function
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
