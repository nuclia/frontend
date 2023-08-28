import {
  FileStatus,
  ISourceConnector,
  SourceConnectorDefinition,
  SyncItem,
  SearchResults,
  ConnectorParameters,
  Link,
} from '../models';
import { concatMap, forkJoin, from, map, Observable, of, tap } from 'rxjs';

export const DropboxConnector: SourceConnectorDefinition = {
  id: 'dropbox',
  factory: () => new DropboxImpl(),
};

class DropboxImpl implements ISourceConnector {
  isExternal = false;
  params: ConnectorParameters = {};

  hasAuthData(): boolean {
    return !!this.params.token;
  }

  setParameters(params: ConnectorParameters) {
    this.params = params;
  }

  getParameters(): ConnectorParameters {
    return this.params;
  }

  getFolders(query?: string): Observable<SearchResults> {
    return this._getFiles(query, true).pipe(
      map((result) => ({
        ...result,
        items: [
          { title: '/', originalId: '', isFolder: true, metadata: {}, status: FileStatus.PENDING },
          ...result.items,
        ],
      })),
    );
  }

  getFiles(query?: string): Observable<SearchResults> {
    return this._getFiles(query);
  }

  getLastModified(since: string, folders?: SyncItem[]): Observable<SyncItem[]> {
    try {
      return forkJoin((folders || []).map((folder) => this._getFiles('', false, folder.originalId))).pipe(
        map((results) =>
          results.reduce(
            (acc, result) => acc.concat(result.items.filter((item) => item.modifiedGMT && item.modifiedGMT > since)),
            [] as SyncItem[],
          ),
        ),
      );
    } catch (err) {
      return of([]);
    }
  }

  private _getFiles(
    query?: string,
    loadFolders = false,
    path = '',
    nextPage?: string | number,
    previous?: SearchResults,
  ): Observable<SearchResults> {
    const success = (url: string) => {
      return (res: any) => {
        if (res.status === 200) {
          return res.json();
        } else if (res.status === 401) {
          console.error(`Unauthorized for ${url}`);
          throw new Error('Unauthorized');
        } else {
          console.error(`Error for ${url}`);
          return res.text().then((text: string) => {
            throw new Error(text || 'Unknown error');
          });
        }
      };
    };
    const failure = (url: string) => {
      return (err) => {
        console.error(`Error for ${url}: ${err}`);
        throw new Error();
      };
    };
    const url = query
      ? `https://api.dropboxapi.com/2/files/search_v2${nextPage ? '/continue' : ''}`
      : `https://api.dropboxapi.com/2/files/list_folder${nextPage ? '/continue' : ''}`;
    const request = fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.params.token || ''}`,
        'Content-Type': 'application/json',
      },
      body: query
        ? JSON.stringify(nextPage ? { cursor: nextPage } : { query })
        : JSON.stringify(
            nextPage ? { cursor: nextPage } : { path, recursive: true, limit: 100, include_media_info: true },
          ),
    }).then(success(url), failure(url));
    return from(request).pipe(
      concatMap((result: any) => {
        const newItems =
          (query
            ? result.matches?.filter((item: any) => this.filterResults(item, loadFolders)).map(this.mapResults)
            : result.entries?.filter((item: any) => this.filterFiles(item, loadFolders)).map(this.mapFiles)) || [];
        const items = [...(previous?.items || []), ...newItems];
        return result.has_more
          ? this._getFiles(query, loadFolders, path, result.cursor, { items, nextPage: result.cursor })
          : of({ items });
      }),
    );
  }

  /* eslint-disable  @typescript-eslint/no-explicit-any */
  private mapFiles(raw: any): SyncItem {
    const isFolder = raw['.tag'] === 'folder';
    return {
      title: raw.name || '',
      originalId: (isFolder ? raw.path_lower : raw.id) || '',
      metadata: {},
      status: FileStatus.PENDING,
      uuid: raw.uuid || '',
      modifiedGMT: raw.client_modified,
      isFolder,
    };
  }

  /* eslint-disable  @typescript-eslint/no-explicit-any */
  private mapResults(raw: any): SyncItem {
    return {
      title: raw.metadata?.metadata?.['name'] || '',
      originalId: raw.metadata?.metadata?.['id'] || '',
      metadata: {},
      status: FileStatus.PENDING,
      uuid: raw.metadata?.metadata?.['uuid'] || '',
      isFolder: raw.match_type?.['.tag'] === 'folder',
    };
  }

  /* eslint-disable  @typescript-eslint/no-explicit-any */
  private filterFiles(raw: any, folders = false): boolean {
    return folders ? raw?.['.tag'] === 'folder' : raw?.['.tag'] !== 'folder';
  }

  /* eslint-disable  @typescript-eslint/no-explicit-any */
  private filterResults(raw: any, folders = false): boolean {
    return folders ? raw.match_type?.['.tag'] === 'folder' : raw.match_type?.['.tag'] !== 'folder';
  }

  download(resource: SyncItem): Observable<Blob | undefined> {
    try {
      return new Observable<Blob | undefined>((observer) => {
        fetch(`https://content.dropboxapi.com/2/files/download`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.params.token || ''}`,
            'Dropbox-API-Arg': JSON.stringify({ path: resource.originalId }),
          },
        })
          .then((res) => res.blob())
          .then(
            (blob) => {
              observer.next(blob);
              observer.complete();
            },
            (e) => {
              console.error(e);
              observer.next(undefined);
              observer.complete();
            },
          );
      });
    } catch (e) {
      console.error(e);
      return of(undefined);
    }
  }

  getLink(resource: SyncItem): Observable<Link> {
    throw new Error('Method not implemented.');
  }

  refreshAuthentication(): Observable<boolean> {
    this.params.token = '';
    return of(false);
  }
}
