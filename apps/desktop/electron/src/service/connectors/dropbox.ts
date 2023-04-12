import {
  FileStatus,
  ISourceConnector,
  SourceConnectorDefinition,
  SyncItem,
  SearchResults,
  ConnectorParameters,
} from '../models';
import { from, map, Observable, of } from 'rxjs';

// TODO: use the default fetch once upgraded to node 18
// import { fetch } from '../utils';

export const DropboxConnector: SourceConnectorDefinition = {
  id: 'dropbox',
  title: 'Dropbox',
  logo: 'assets/logos/dropbox.svg',
  description: 'File storage and synchronization service developed by Dropbox',
  factory: () => new DropboxImpl(),
};

class DropboxImpl implements ISourceConnector {
  isExternal = false;
  params: ConnectorParameters = {};

  setParameters(params: ConnectorParameters) {
    this.params = params;
  }

  getFolders(query?: string): Observable<SearchResults> {
    return this._getFiles(query, true);
  }

  getFiles(query?: string): Observable<SearchResults> {
    return this._getFiles(query);
  }

  getLastModified(since: string): Observable<SyncItem[]> {
    return this.getFiles().pipe(
      map((results) => results.items.filter((item) => item.modified && item.modified > since)),
    );
  }

  private _getFiles(query?: string, loadFolders = false, nextPage?: string | number): Observable<SearchResults> {
    const success = (res: any) => {
      if (res.status === 401) {
        throw new Error('Unauthorized');
      } else {
        return res.json();
      }
    };
    const failure = () => {
      throw new Error();
    };
    const request = query
      ? fetch(`https://api.dropboxapi.com/2/files/search_v2${nextPage ? '/continue' : ''}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.params.token || ''}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(nextPage ? { cursor: nextPage } : { query }),
        }).then(success, failure)
      : fetch(`https://api.dropboxapi.com/2/files/list_folder${nextPage ? '/continue' : ''}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.params.token || ''}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(
            nextPage ? { cursor: nextPage } : { path: '', recursive: true, limit: 100, include_media_info: true },
          ),
        }).then(success, failure);
    return from(request).pipe(
      map((result: any) => ({
        items:
          (query
            ? result.matches?.filter((item: any) => this.filterResults(item, loadFolders)).map(this.mapResults)
            : result.entries?.filter((item: any) => this.filterFiles(item, loadFolders)).map(this.mapFiles)) || [],
        nextPage: result.has_more ? this._getFiles(query, loadFolders, result.cursor) : undefined,
      })),
    );
  }

  /* eslint-disable  @typescript-eslint/no-explicit-any */
  private mapFiles(raw: any): SyncItem {
    return {
      title: raw.name || '',
      originalId: raw.id || '',
      metadata: {},
      status: FileStatus.PENDING,
      uuid: raw.uuid || '',
      modified: raw.client_modified,
      isFolder: raw['.tag'] === 'folder',
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
}
