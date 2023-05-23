import { map, Observable, of, tap } from 'rxjs';
import {
  ConnectorParameters,
  FileStatus,
  ISourceConnector,
  Link,
  SearchResults,
  SourceConnectorDefinition,
  SyncItem,
} from '../models';

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
    return of({
      items: [
        {
          title: sitemapUrl,
          status: FileStatus.PENDING,
          uuid: `${new Date().getTime()}`,
          originalId: sitemapUrl,
          metadata: { uri: sitemapUrl },
        },
      ],
    });
  }

  getLastModified(since: string, folders?: SyncItem[] | undefined): Observable<SyncItem[]> {
    return this.getFiles().pipe(
      tap((searchResults) => console.log(since, searchResults)),
      map((searchResults) => {
        // TODO: filter out items to get only last modified ones
        //  .filter((item) => item.modifiedGMT && item.modifiedGMT > since);
        return searchResults.items;
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
