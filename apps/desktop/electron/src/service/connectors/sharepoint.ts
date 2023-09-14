import {
  ISourceConnector,
  SourceConnectorDefinition,
  SyncItem,
  SearchResults,
  ConnectorParameters,
  FileStatus,
  Link,
} from '../models';
import { Observable, of, from, map, concatMap, forkJoin } from 'rxjs';
import { OAuthBaseConnector } from './oauth.base';

export const SharepointConnector: SourceConnectorDefinition = {
  id: 'sharepoint',
  factory: () => new SharepointImpl(),
};

const SCOPE = 'https://graph.microsoft.com/files.read offline_access';

class SharepointImpl extends OAuthBaseConnector implements ISourceConnector {
  isExternal = false;
  params: ConnectorParameters = {};

  hasAuthData() {
    return !!this.params.token;
  }

  setParameters(params: ConnectorParameters) {
    this.params = params;
  }

  getParameters(): ConnectorParameters {
    return this.params;
  }

  getLastModified(since: string, folders?: SyncItem[] | undefined): Observable<SyncItem[]> {
    try {
      return forkJoin((folders || []).map((folder) => this._getItems(folder.uuid, false, since))).pipe(
        map((results) => results.reduce((acc, result) => acc.concat(result.items), [] as SyncItem[])),
      );
    } catch (err) {
      return of([]);
    }
  }

  getFolders(query?: string | undefined): Observable<SearchResults> {
    return this._getItems('', true);
  }

  getFiles(query?: string): Observable<SearchResults> {
    return this._getItems();
  }

  private _getItems(
    folder = '',
    foldersOnly = false,
    since?: string,
    siteId?: string,
    nextPage?: string,
    previous?: SearchResults,
  ): Observable<SearchResults> {
    let path = '';
    return (siteId ? of(siteId) : this.getSiteId()).pipe(
      concatMap((_siteId) => {
        siteId = _siteId;
        if (foldersOnly) {
          path = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists`;
        } else if (folder) {
          path = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${folder}/items?expand=fields`;
          if (since) {
            path += `&$filter=fields/Modified gt '${since}'`;
          }
        } else {
          throw new Error('One-shot import not implemented for Sharepoint.');
        }
        if (nextPage) {
          path += `&$skiptoken=${nextPage}`;
        }
        return from(
          fetch(path, {
            headers: {
              Authorization: `Bearer ${this.params.token}`,
              Prefer: 'HonorNonIndexedQueriesWarningMayFailRandomly',
            },
          }).then(
            (res) => res.json(),
            (err) => {
              console.error(`Error fetching ${path}: ${err}`);
            },
          ),
        );
      }),
      concatMap((res) => {
        if (res.error) {
          console.error(`Error fetching ${path}: ${res.error}`);
          if (res.error.code === 'InvalidAuthenticationToken') {
            throw new Error('Unauthorized');
          } else {
            throw new Error(res.error.message || 'Unknown error');
          }
        } else {
          const nextPage =
            res['@odata.nextLink'] && res['@odata.nextLink'].includes('&$skiptoken=')
              ? res?.['@odata.nextLink'].split('&$skiptoken=')[1].split('&')[0]
              : undefined;
          const items = (res.value || [])
            .filter((item: any) => foldersOnly || item.fields?.ContentType === 'Document')
            .map((item: any) =>
              foldersOnly ? this.mapToSyncItemFolder(item) : this.mapToSyncItem(item, siteId || '', folder),
            );
          const results = {
            items: [...(previous?.items || []), ...items],
            nextPage,
          };
          return nextPage ? this._getItems(folder, foldersOnly, since, siteId, nextPage, results) : of(results);
        }
      }),
    );
  }

  private mapToSyncItem(item: any, siteId: string, listId: string): SyncItem {
    return {
      uuid: item.webUrl,
      title: item.fields?.FileLeafRef || item.webUrl,
      originalId: item.webUrl,
      modifiedGMT: item.lastModifiedDateTime,
      metadata: {
        downloadLink: `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items/${item.id}/driveitem/content`,
      },
      status: FileStatus.PENDING,
    };
  }

  private mapToSyncItemFolder(item: any): SyncItem {
    return {
      uuid: item.id,
      title: item.name,
      originalId: item.id,
      metadata: {},
      status: FileStatus.PENDING,
      isFolder: true,
    };
  }

  getLink(resource: SyncItem): Observable<Link> {
    throw new Error('Method not implemented.');
  }

  download(resource: SyncItem): Observable<Blob> {
    return from(
      fetch(resource.metadata.downloadLink, { headers: { Authorization: `Bearer ${this.params.token || ''}` } }).then(
        (res) => res.blob(),
      ),
    );
  }

  private getSiteId(): Observable<string> {
    const path = `https://graph.microsoft.com/v1.0/sites?search=${this.params.site_name}}`;
    return from(
      fetch(path, {
        headers: {
          Authorization: `Bearer ${this.params.token || ''}`,
        },
      }).then((res) => res.json()),
    ).pipe(
      map((res) => {
        if (res.error) {
          throw new Error(`Error fetching Sharepoint site id for "${this.params.site_name}": ${res.error.message}`);
        }
        return res.value[0]?.id || '';
      }),
    );
  }
}
