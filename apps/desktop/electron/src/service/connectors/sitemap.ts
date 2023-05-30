import { map, Observable, of } from 'rxjs';
import {
  ConnectorParameters,
  FileStatus,
  ISourceConnector,
  Link,
  SearchResults,
  SourceConnectorDefinition,
  SyncItem,
} from '../models';
import { getSiteMap } from '../sitemap-parser';

export const SitemapConnector: SourceConnectorDefinition = {
  id: 'sitemap',
  factory: () => new SitemapImpl(),
};

class SitemapImpl implements ISourceConnector {
  isExternal = true;
  params: ConnectorParameters = {};

  hasAuthData(): boolean {
    return true;
  }

  setParameters(params: ConnectorParameters) {
    this.params = params;
  }

  getParameters(): ConnectorParameters {
    return this.params;
  }

  getFolders(query?: string | undefined): Observable<SearchResults> {
    throw new Error('Method "getFolders" not implemented.');
  }

  getFiles(query?: string | undefined): Observable<SearchResults> {
    const sitemapUrl = this.params['sitemap'];

    return getSiteMap(sitemapUrl).pipe(
      map((parsedUrls) => ({
        items: parsedUrls.map((parsedUrl) => ({
          title: parsedUrl.loc,
          status: FileStatus.PENDING,
          uuid: `${new Date().getTime()}`,
          originalId: parsedUrl.loc,
          metadata: {
            uri: parsedUrl.loc,
            lastModified: parsedUrl.lastmod,
          },
        })),
      })),
    );
  }

  getLastModified(since: string, folders?: SyncItem[] | undefined): Observable<SyncItem[]> {
    return this.getFiles().pipe(
      map((searchResults) => {
        return searchResults.items.filter(
          (item) => item.metadata['lastModified'] && item.metadata['lastModified'] > since,
        );
      }),
    );
  }

  download(resource: SyncItem): Observable<Blob | undefined> {
    throw new Error('Method "download" not implemented.');
  }

  getLink(resource: SyncItem): Observable<Link> {
    const newLink: Link = { uri: resource.metadata['uri'], extra_headers: {} };
    return of(newLink);
  }

  refreshAuthentication(): Observable<boolean> {
    return of(true);
  }
}
