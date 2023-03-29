import {
  FileStatus,
  ISourceConnector,
  SourceConnectorDefinition,
  SyncItem,
  SearchResults,
  Field,
  ConnectorParameters,
} from '../models';
import { filter, from, map, Observable, of, switchMap, take } from 'rxjs';

// eslint-disable-next-line no-new-func
const importDynamic = new Function('modulePath', 'return import(modulePath)');

const fetch = async (...args: any[]) => {
  const module = await importDynamic('node-fetch');
  return module.default(...args);
};

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

  getFiles(query?: string, pageSize?: number): Observable<SearchResults> {
    return this._getFiles(query, pageSize);
  }

  private _getFiles(query?: string, pageSize = 100, nextPage?: string | number): Observable<SearchResults> {
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
          body: JSON.stringify(nextPage ? { cursor: nextPage } : { path: '', recursive: true, limit: pageSize }),
        }).then(success, failure);
    return from(request).pipe(
      map((result: any) => ({
        items:
          (query
            ? result.matches?.filter(this.filterResults).map(this.mapResults)
            : result.entries?.filter(this.filterFiles).map(this.mapFiles)) || [],
        nextPage: result.has_more ? this._getFiles(query, pageSize, result.cursor) : undefined,
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
    };
  }

  /* eslint-disable  @typescript-eslint/no-explicit-any */
  private filterFiles(raw: any): boolean {
    return raw?.['.tag'] !== 'folder';
  }

  /* eslint-disable  @typescript-eslint/no-explicit-any */
  private filterResults(raw: any): boolean {
    return raw.match_type?.['.tag'] !== 'folder';
  }

  download(resource: SyncItem): Observable<Blob> {
    return from(
      fetch(`https://content.dropboxapi.com/2/files/download`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.params.token || ''}`,
          'Dropbox-API-Arg': JSON.stringify({ path: resource.originalId }),
        },
      }).then((res) => {
        const blob = res.blob();
        return blob;
      }),
    );
  }
}
