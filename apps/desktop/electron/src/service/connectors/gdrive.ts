import {
  ISourceConnector,
  SourceConnectorDefinition,
  SyncItem,
  SearchResults,
  ConnectorParameters,
  FileStatus,
  Link,
} from '../models';
import { Observable, of, from, map, concatMap, forkJoin, tap } from 'rxjs';

export const GDriveConnector: SourceConnectorDefinition = {
  id: 'gdrive',
  factory: () => new GDriveImpl(),
};

class GDriveImpl implements ISourceConnector {
  params: ConnectorParameters = {};
  isExternal = false;

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
    let path = `https://www.googleapis.com/drive/v3/files?pageSize=50&fields=nextPageToken,files(id,name,mimeType,modifiedTime)`;
    if (query) {
      path += `&q=name contains '${query}' and ${
        foldersOnly ? '' : 'not '
      }mimeType = 'application/vnd.google-apps.folder'`;
    } else {
      path += `&q=${foldersOnly ? '' : 'not '}mimeType = 'application/vnd.google-apps.folder'`;
    }
    path += folder ? ` and '${folder}' in parents` : '';
    if (nextPage) {
      path += `&pageToken=${nextPage}`;
    }

    return from(
      fetch(path, {
        headers: {
          Authorization: `Bearer ${this.params.token || ''}`,
        },
      }).then(
        (res) => res.json(),
        (err) => {
          console.error(`Error fetching ${path}: ${err}`);
        },
      ),
    ).pipe(
      concatMap((res) => {
        if (res.error) {
          if (res.error.status === 'UNAUTHENTICATED') {
            throw new Error('Unauthorized');
          } else {
            throw new Error(res.error.message || 'Unknown error');
          }
        } else {
          const nextPage = res['nextPageToken'];
          const items = (res.files || []).map((item: any) => this.mapToSyncItem(item));
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
    const needsPdfConversion = item.mimeType.startsWith('application/vnd.google-apps');
    return {
      uuid: item.id,
      title: item.name,
      originalId: item.id,
      modifiedGMT: item.modifiedTime,
      metadata: {
        needsPdfConversion: needsPdfConversion ? 'yes' : 'no',
        mimeType: needsPdfConversion ? 'application/pdf' : item.mimeType,
      },
      status: FileStatus.PENDING,
    };
  }

  getLink(resource: SyncItem): Observable<Link> {
    throw new Error('Method not implemented.');
  }

  download(resource: SyncItem): Observable<Blob> {
    return new Observable<Blob>((observer) => {
      const request =
        resource.metadata.needsPdfConversion === 'yes'
          ? `https://www.googleapis.com/drive/v3/files/${resource.originalId}/export?mimeType=application/pdf&supportsAllDrives=true`
          : `https://www.googleapis.com/drive/v3/files/${resource.originalId}?alt=media&supportsAllDrives=true`;

      fetch(request, {
        method: 'GET',
        headers: { Authorization: `Bearer ${this.params.token}` },
      })
        .then((response) => response.blob())
        .then((blob) => {
          observer.next(blob);
          observer.complete();
        });
    });
  }

  refreshAuthentication(): Observable<boolean> {
    return from(
      fetch(`${this.params.refresh_endpoint}?refresh_token=${this.params.refresh}`, {
        method: 'GET',
        headers: {
          origin: 'http://localhost:4200/',
        },
      }).then((res) => res.json()),
    ).pipe(
      map((res) => {
        if (res.token) {
          this.params.token = res.token;
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
