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

export const SitemapConnector: ConnectorDefinition = {
  id: 'sitemap',
  title: 'Sitemap',
  logo: `${baseLogoPath}/sitemap.svg`,
  description: 'Upload web pages from a sitemap.xml',
  permanentSyncOnly: true,
  factory: () => new SitemapImpl(),
};

class SitemapImpl implements IConnector {
  hasServerSideAuth = false;
  isExternal = true;
  allowToSelectFolders = false;
  canSyncSecurityGroups = false;

  getStaticFolders(): SyncItem[] {
    return [
      {
        uuid: '',
        title: 'Sitemap',
        originalId: 'SITEMAP',
        metadata: {},
        status: FileStatus.PENDING,
      },
    ];
  }

  getParametersSections(): Observable<Section[]> {
    return of([
      {
        id: 'url',
        title: 'sync.connectors.sitemap.url.section-title',
        fields: [
          {
            id: 'sitemap',
            label: 'sync.connectors.sitemap.url.label',
            type: 'text',
            required: true,
            pattern: /.+\.(ashx|xml)/,
            placeholder: 'https://my-website.com/sitemap.xml',
          },
        ],
      },
      {
        id: 'restrict-indexation',
        title: 'sync.connectors.common.restrict-indexation.title',
        description: 'sync.connectors.common.restrict-indexation.description',
        badge: 'generic.badge.optional',
        fields: [
          {
            id: 'cssSelector',
            label: 'sync.connectors.common.css.label',
            help: 'sync.connectors.common.css.help',
            type: 'text',
            required: false,
            placeholder: '.main-content',
          },
          {
            id: 'xpathSelector',
            label: 'sync.connectors.common.xpath.label',
            help: 'sync.connectors.common.xpath.help',
            type: 'text',
            required: false,
            placeholder: '//div[@id="main"]',
          },
        ],
      },
      {
        id: 'web-scraping-helpers',
        title: 'sync.connectors.common.web-scraping-helpers.title',
        description: 'sync.connectors.common.web-scraping-helpers.description',
        badge: 'generic.badge.advanced',
        fields: [
          {
            id: 'localExtract',
            label: 'sync.connectors.common.local-extract.label',
            help: 'sync.connectors.common.local-extract.help',
            type: 'boolean',
            required: false,
          },
          {
            id: 'keepQueryString',
            label: 'sync.connectors.common.keep-querystring.label',
            help: 'sync.connectors.common.keep-querystring.help',
            type: 'boolean',
            required: false,
          },
          {
            id: 'headers',
            label: 'sync.connectors.common.headers.label',
            help: 'sync.connectors.common.headers.help',
            type: 'table',
            required: false,
          },
          {
            id: 'cookies',
            label: 'sync.connectors.common.cookies.label',
            help: 'sync.connectors.common.cookies.help',
            type: 'table',
            required: false,
          },
          {
            id: 'localstorage',
            label: 'sync.connectors.common.localstorage.label',
            help: 'sync.connectors.common.localstorage.help',
            type: 'table',
            required: false,
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
