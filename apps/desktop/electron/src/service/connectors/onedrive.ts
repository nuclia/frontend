import {
  ISourceConnector,
  SourceConnectorDefinition,
  SyncItem,
  SearchResults,
  ConnectorParameters,
  FileStatus,
  Link,
} from '../models';
import { Observable, of, from, map, filter, switchMap, tap } from 'rxjs';

export const OneDriveConnector: SourceConnectorDefinition = {
  id: 'onedrive',
  factory: () => new OneDriveImpl(),
};

const SCOPE = 'https://graph.microsoft.com/files.read offline_access';
// const SCOPE = 'https://graph.microsoft.com/.default';

class OneDriveImpl implements ISourceConnector {
  isExternal = true;
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
    throw new Error('Method not implemented.');
  }

  getFolders(query?: string | undefined): Observable<SearchResults> {
    throw new Error('Method not implemented.');
  }

  getFiles(query?: string, pageSize = 50, nextPage?: string): Observable<SearchResults> {
    return this._getFiles(query, pageSize, nextPage);
  }

  private _getFiles(query = '', folder = '', pageSize = 50, nextPage?: string): Observable<SearchResults> {
    let path = `https://graph.microsoft.com/v1.0/me/drive/${folder ? `items/${folder}` : 'root'}`;
    if (query) {
      path += `/search(q='${query}')`;
    } else {
      path += `/children`;
    }
    path += `?top=${pageSize}&filter=file ne null`;
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
      map((res) => {
        if (res.error) {
          throw res.error;
        } else {
          const nextPage =
            res['@odata.nextLink'] && res['@odata.nextLink'].includes('&$skiptoken=')
              ? res?.['@odata.nextLink'].split('&$skiptoken=')[1].split('&')[0]
              : undefined;
          return {
            items: (res.value || []).map((item: any) => this.mapToSyncItem(item)),
            nextPage,
          };
        }
      }),
    );
  }

  private mapToSyncItem(item: any): SyncItem {
    return {
      uuid: item.id,
      title: item.name,
      originalId: item.id,
      metadata: { mimeType: item.file.mimeType, downloadLink: item['@microsoft.graph.downloadUrl'] },
      status: FileStatus.PENDING,
    };
  }

  getLink(resource: SyncItem): Observable<Link> {
    return of({ uri: resource.metadata.downloadLink, extra_headers: {} });
  }

  download(resource: SyncItem): Observable<Blob> {
    throw 'Error';
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
        console.log(res);
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
