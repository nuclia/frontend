import { ConnectorParameters, IConnector, Section, SyncItem } from '../models';
import { Observable, of } from 'rxjs';

export class SitemapCloudConnector implements IConnector {
  hasServerSideAuth = false;
  isExternal = true;
  allowToSelectFolders = false;
  canSyncSecurityGroups = false;
  canSyncLastChanges = true;

  getParametersSections(): Observable<Section[]> {
    return of([
      {
        id: 'sitemap',
        title: 'sync.connectors.sitemap.url.section-title',
        fields: [
          {
            id: 'url',
            label: 'sync.connectors.sitemap.url.label',
            type: 'text',
            help: 'generic.required-field',
            required: true,
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
            id: 'css_selector',
            label: 'sync.connectors.common.css.label',
            help: 'sync.connectors.common.css.help',
            type: 'text',
            placeholder: '.main-content',
          },
          {
            id: 'xpath_selector',
            label: 'sync.connectors.common.xpath.label',
            help: 'sync.connectors.common.xpath.help',
            type: 'text',
            placeholder: '//div[@id="main"]',
          },
        ],
      },
      {
        id: 'web-scraping-helpers',
        title: 'sync.connectors.common.web-scraping-helpers.title',
        description: 'sync.connectors.common.web-scraping-helpers.description',
        badge: 'generic.badge.optional',
        fields: [
          {
            id: 'keep_query_string',
            label: 'sync.connectors.common.keep-querystring.label',
            help: 'sync.connectors.common.keep-querystring.help',
            type: 'boolean',
          },
          {
            id: 'headers',
            label: 'sync.connectors.common.headers.label',
            type: 'table',
          },
          {
            id: 'cookies',
            label: 'sync.connectors.common.cookies.label',
            type: 'table',
          },
          {
            id: 'localstorage',
            label: 'sync.connectors.common.localstorage.label',
            type: 'table',
          },
        ],
      },
    ]);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleParameters(params: ConnectorParameters) {
    return;
  }

  getParametersValues(): ConnectorParameters {
    return {};
  }

  getStaticFolders(): SyncItem[] {
    return [];
  }

  mapParametersToFormValues(params: ConnectorParameters): { [key: string]: any } {
    const toRows = (items: Record<string, any>) => Object.entries(items ?? {}).map(([key, value]) => ({ key, value }));
    return {
      ...params['sitemap'],
      cookies: params['sitemap']?.cookies ? toRows(params['sitemap']?.cookies) : [],
      localstorage: params['sitemap']?.localstorage ? toRows(params['sitemap']?.localstorage) : [],
      headers: params['sitemap']?.headers ? toRows(params['sitemap']?.headers) : [],
    };
  }

  mapFormValuesToParameters(formValues: { [key: string]: any }): ConnectorParameters {
    return {
      sitemap: {
        ...Object.fromEntries(
          Object.entries(formValues)
            .filter(([, value]) => value !== '')
            .map(([key, value]) => {
              value =
                ['cookies', 'headers', 'localstorage'].includes(key) && Array.isArray(value)
                  ? Object.fromEntries(value.map((row) => [row.key, row.value]))
                  : value;
              return [key, value];
            }),
        ),
      },
    };
  }
}
