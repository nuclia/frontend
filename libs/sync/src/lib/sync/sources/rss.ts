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
  canSyncSecurityGroups = false;

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
        label: 'connectors.common.css.label',
        help: 'connectors.common.css.help',
        type: 'text',
        required: false,
        placeholder: '.main-content',
      },
      {
        id: 'xpathSelector',
        label: 'connectors.common.xpath.label',
        help: 'connectors.common.xpath.help',
        type: 'text',
        required: false,
        placeholder: '//div[@id="main"]',
      },
      {
        id: 'headers',
        label: 'connectors.common.headers.label',
        help: 'connectors.common.headers.help',
        type: 'table',
        required: false,
      },
      {
        id: 'cookies',
        label: 'connectors.common.cookies.label',
        help: 'connectors.common.cookies.help',
        type: 'table',
        required: false,
      },
      {
        id: 'localstorage',
        label: 'connectors.common.localstorage.label',
        help: 'connectors.common.localstorage.help',
        type: 'table',
        required: false,
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