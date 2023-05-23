import { map, Observable, of } from 'rxjs';
import {
  ConnectorParameters,
  ISourceConnector,
  Link,
  SearchResults,
  SourceConnectorDefinition,
  SyncItem,
  FileStatus,
} from '../models';
import { fetchSitemap, parseSitemap } from '../sitemap-parser';

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
    throw new Error('Method getFolders not implemented.');
  }

  getFiles(query?: string | undefined): Observable<SearchResults> {
    return fetchSitemap(this.params['sitemap']).pipe(
      map((sitemapContent) => {
        const parsedUrls = parseSitemap(sitemapContent);
        console.log('Parsed URLs:', parsedUrls);
        const searchResults:SearchResults = { items: parsedUrls.map(([url, lastmod]) => {
            console.log('URL:', url);
            console.log('Last Modified:', lastmod);
            const syncItem:SyncItem = {title: url, originalId: url, metadata: {uri: url, modifiedGMT: new Date(lastmod).toISOString()}, status: FileStatus.PENDING};
            return syncItem;
        })};
        // return searchResults;
        return {items: []};

      }),
    );
  }

  getLastModified(since: string, folders?: SyncItem[] | undefined): Observable<SyncItem[]> {
    return this.getFiles().pipe(
      map((searchResults) => {
        return searchResults.items.filter((item) => item.modifiedGMT && item.modifiedGMT > since);
      }),
    );
  }

  download(resource: SyncItem): Observable<Blob | undefined> {
    throw new Error('Method download not implemented.');
  }

  getLink(resource: SyncItem): Observable<Link> {
    console.log('Im in getLink');
    const newLink: Link = { uri: resource.metadata['uri'], extra_headers: {} };

    return of(newLink);
  }

  refreshAuthentication(): Observable<boolean> {
    return of(true);
  }
}
