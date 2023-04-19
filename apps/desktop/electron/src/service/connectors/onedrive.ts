import {
  ISourceConnector,
  SourceConnectorDefinition,
  SyncItem,
  SearchResults,
  ConnectorParameters,
  FileStatus,
  Link,
} from '../models';
import { Observable, of, from, map, filter, switchMap, tap, concatMap, forkJoin } from 'rxjs';

export const OneDriveConnector: SourceConnectorDefinition = {
  id: 'onedrive',
  factory: () => new OneDriveImpl(),
};

const SCOPE = 'https://graph.microsoft.com/files.read offline_access';
// const SCOPE = 'https://graph.microsoft.com/.default';

class OneDriveImpl implements ISourceConnector {
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
      return forkJoin((folders || []).map((folder) => this._getItems('', folder.uuid))).pipe(
        map((results) => {
          console.log(results[0].items[0].modifiedGMT, since);
          return results.reduce(
            (acc, result) => acc.concat(result.items.filter((item) => item.modifiedGMT && item.modifiedGMT > since)),
            [] as SyncItem[],
          );
        }),
      );
    } catch (err) {
      return of([]);
    }
  }

  getFolders(query?: string | undefined): Observable<SearchResults> {
    return this._getItems(query, '', true);
  }

  getFiles(query?: string): Observable<SearchResults> {
    return this._getItems(query);
  }

  private _getItems(
    query = '',
    folder = '',
    foldersOnly = false,
    nextPage?: string,
    previous?: SearchResults,
  ): Observable<SearchResults> {
    let path = `https://graph.microsoft.com/v1.0/me/drive/${folder ? `items/${folder}` : 'root'}`;
    if (query) {
      path += `/search(q='${query}')`;
    } else {
      path += `/children`;
    }
    path += `?top=100&filter=${foldersOnly ? 'folder' : 'file'} ne null`;
    if (nextPage) {
      path += `&$skiptoken=${nextPage}`;
    }

    return from(
      fetch(path, {
        headers: {
          Authorization: `Bearer ${this.params.token || ''}`,
        },
      }).then((res) => res.json()),
    ).pipe(
      concatMap((res) => {
        if (res.error) {
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
          const items = (res.value || []).map((item: any) =>
            foldersOnly ? this.mapToSyncItemFolder(item) : this.mapToSyncItem(item),
          );
          const results = {
            items: [...(previous?.items || []), ...items],
            nextPage,
          };
          return nextPage ? this._getItems(query, folder, foldersOnly, nextPage, results) : of(results);
        }
      }),
    );
  }

  private mapToSyncItem(item: any): SyncItem {
    return {
      uuid: item.id,
      title: item.name,
      originalId: item.id,
      modifiedGMT: item.lastModifiedDateTime,
      metadata: { mimeType: item.file.mimeType, downloadLink: item['@microsoft.graph.downloadUrl'] },
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

  refreshAuthentication(): Observable<boolean> {
    return from(
      fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          origin: 'http://localhost:4200/',
        },
        body: `client_id=${this.params.client_id}&refresh_token=${this.params.refresh}&grant_type=refresh_token&scope=${SCOPE}`,
      }).then((res) => res.json()),
    ).pipe(
      map((res) => {
        if (res.access_token && res.refresh_token) {
          this.params.token = res.access_token;
          this.params.refresh = res.refresh_token;
          return true;
        } else {
          this.params.token = '';
          this.params.refresh = '';
          return false;
        }
      }),
    );
  }
}
