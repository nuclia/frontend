import { Observable, of, map } from 'rxjs';
import {
  ISourceConnector,
  SourceConnectorDefinition,
  SyncItem,
  SearchResults,
  ConnectorParameters,
  Link,
} from '../models';
import {
    fetchSitemap,
    parseSitemap
} from '../sitemap-parser';

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
        throw new Error("Method not implemented.");   
    }

    getFiles(query?: string | undefined): Observable<SearchResults> {
        let url = this.getParameters();
        console.log('URL:', url);
        return fetchSitemap(url).then((sitemapContent) => {
            console.log('Sitemap Content:', sitemapContent);
            let parsedUrls = parseSitemap(sitemapContent)
            let searchResults = new SearchResults();
            searchResults.items = parsedUrls.map(([url, lastmod]) => {
                console.log('URL:', url);
                console.log('Last Modified:', lastmod);

                let syncItem = new SyncItem();
                syncItem.title = url;
                syncItem.originalId = url;
                syncItem.metadata = {
                    'uri': url,
                    'modifiedGMT': new Date(lastmod).toISOString()
                };
                return syncItem;
            });
        });
    }

    getLastModified(since: string, folders?: SyncItem[] | undefined): Observable<SyncItem[]> {
        return this.getFiles().pipe(map(searchResults => {
            return searchResults.items.filter(item => item.modifiedGMT && item.modifiedGMT > since);
        })) 
    }


    download(resource: SyncItem): Observable<Blob | undefined> {
        throw new Error("Method not implemented.");
    }

    getLink(resource: SyncItem): Observable<Link> {
        const newLink:Link = {uri: resource.metadata['uri'], extra_headers: {}};

        return of(newLink);
    }

    refreshAuthentication(): Observable<boolean> {
        return of(true);
    }
    
}
