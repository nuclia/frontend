import {
  ConnectorSettings,
  FileStatus,
  ISourceConnector,
  SourceConnectorDefinition,
  SyncItem,
  SearchResults,
  Field,
  ConnectorParameters,
} from '../models';
import { filter, from, map, Observable, of, switchMap, take } from 'rxjs';

export const DropboxConnector: SourceConnectorDefinition = {
  id: 'dropbox',
  title: 'Dropbox',
  logo: 'assets/logos/dropbox.svg',
  description: 'File storage and synchronization service developed by Dropbox',
  factory: (data?: ConnectorSettings) => of(new DropboxImpl(data)),
};

const TOKEN = 'DROPBOX_TOKEN';
class DropboxImpl implements ISourceConnector {
  hasServerSideAuth = false;
  isExternal = false;
  resumable = true;

  constructor(data?: ConnectorSettings) {
    // eslint-disable-next-line no-empty-function
  }

  getParameters(): Observable<Field[]> {
    return of([
      {
        id: 'token',
        label: 'App token',
        type: 'text',
        required: true,
      },
    ]);
  }

  handleParameters(params: ConnectorParameters) {
    localStorage.setItem(TOKEN, params.token);
  }

  goToOAuth(reset?: boolean) {
    return of(true);
  }

  authenticate(): Observable<boolean> {
    return of(true);
  }

  getFiles(query?: string, pageSize?: number): Observable<SearchResults> {
    return this._getFiles(query, pageSize);
  }

  private _getFiles(query?: string, pageSize: number = 100, nextPage?: string | number): Observable<SearchResults> {
    const request = query
      ? fetch(`https://api.dropboxapi.com/2/files/search_v2${nextPage ? '/continue' : ''}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem(TOKEN || '')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(nextPage ? { cursor: nextPage } : { query }),
        })
      : fetch(`https://api.dropboxapi.com/2/files/list_folder${nextPage ? '/continue' : ''}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem(TOKEN || '')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(nextPage ? { cursor: nextPage } : { path: '', recursive: true, limit: pageSize }),
        });
    return this.authenticate().pipe(
      filter((isSigned) => isSigned),
      take(1),
      switchMap(() =>
        from(request.then((res) => res.json())).pipe(
          map((result: any) => ({
            items:
              (query
                ? result.matches?.filter(this.filterResults).map(this.mapResults)
                : result.entries?.filter(this.filterFiles).map(this.mapFiles)) || [],
            nextPage: result.has_more ? this._getFiles(query, pageSize, result.cursor) : undefined,
          })),
        ),
      ),
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
          Authorization: `Bearer ${localStorage.getItem(TOKEN || '')}`,
          'Dropbox-API-Arg': JSON.stringify({ path: resource.originalId }),
        },
      }).then((res) => res.blob()),
    );
  }
}
