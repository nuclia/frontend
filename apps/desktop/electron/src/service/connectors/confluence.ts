import {
  FileStatus,
  ISourceConnector,
  SourceConnectorDefinition,
  SyncItem,
  SearchResults,
  ConnectorParameters,
  Link,
} from '../models';
import { concatMap, forkJoin, from, map, Observable, of } from 'rxjs';

export const ConfluenceConnector: SourceConnectorDefinition = {
  id: 'confluence',
  factory: () => new ConfluenceImpl(),
};

const BATCH_SIZE = 50;

class ConfluenceImpl implements ISourceConnector {
  isExternal = false;
  params: ConnectorParameters = {};

  hasAuthData(): boolean {
    return !!this.params.token && !!this.params.url && !!this.params.user;
  }

  setParameters(params: ConnectorParameters) {
    this.params = params;
  }

  getParameters(): ConnectorParameters {
    return this.params;
  }

  getFolders(query?: string): Observable<SearchResults> {
    return this._getFiles(query, true);
  }

  getFiles(query?: string): Observable<SearchResults> {
    return this._getFiles(query);
  }

  getLastModified(since: string, folders?: SyncItem[]): Observable<SyncItem[]> {
    try {
      return forkJoin((folders || []).map((folder) => this._getFiles('', false, folder.originalId, since))).pipe(
        map((results) => results.reduce((acc, result) => acc.concat(result.items), [] as SyncItem[])),
      );
    } catch (err) {
      return of([]);
    }
  }

  private _getFiles(
    query?: string,
    loadFolders = false,
    folder = '',
    lastModified?: string,
    start?: number,
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
      return (err: any) => {
        console.error(`Error for ${url}: ${err}`);
        throw new Error();
      };
    };
    const endpoint = loadFolders
      ? `${this.params.url}/rest/api/space?`
      : folder
      ? `${this.params.url}/rest/api/content/search?cql=space="${folder}" and lastModified > "${
          lastModified ? lastModified.slice(0, 16).replace('T', ' ') : '1970-01-01'
        }"`
      : query
      ? `${this.params.url}/rest/api/content/search?cql=text~"${query}"`
      : `${this.params.url}/rest/api/content?`;
    const request = fetch(`${endpoint}&limit=${BATCH_SIZE}&start=${start || 0}`, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${btoa(this.params.user + ':' + this.params.token)}`,
        'Content-Type': 'application/json',
      },
    }).then(success(endpoint), failure(endpoint));
    return from(request).pipe(
      concatMap((result: any) => {
        const newItems = result.results?.map((r: any) => this.mapResults(r, loadFolders));
        const items = [...(previous?.items || []), ...newItems];
        const next = (start || 0) + BATCH_SIZE;
        return result._links.next
          ? this._getFiles(query, loadFolders, folder, lastModified, next, { items })
          : of({ items });
      }),
    );
  }

  /* eslint-disable  @typescript-eslint/no-explicit-any */
  private mapResults(raw: any, isFolder = false): SyncItem {
    const isAttachment = raw.type === 'attachment';
    const itemOriginalId = isAttachment ? raw._links?.webui?.split('pageId=')[1].split('&')[0] || '' : raw.id;
    return {
      title: (isFolder ? raw.name : raw.title) || '',
      originalId: (isFolder ? raw.key : itemOriginalId) || '',
      metadata: { type: raw.type || '' },
      status: FileStatus.PENDING,
      uuid: raw.id || '',
      isFolder: false,
    };
  }

  download(
    resource: SyncItem,
  ): Observable<{ body: string; format?: 'PLAIN' | 'MARKDOWN' | 'HTML' } | Blob | undefined> {
    try {
      if (resource.metadata.type === 'attachment') {
        return from(
          fetch(`${this.params.url}/download/attachments/${resource.originalId}/${resource.title}`, {
            method: 'GET',
            headers: {
              Authorization: `Basic ${btoa(this.params.user + ':' + this.params.token)}`,
            },
          }).then((res) => res.blob()),
        );
      } else {
        return from(
          fetch(`${this.params.url}/rest/api/content/${resource.originalId}?expand=body.storage`, {
            method: 'GET',
            headers: {
              Authorization: `Basic ${btoa(this.params.user + ':' + this.params.token)}`,
              'Content-Type': 'application/json',
            },
          }).then((res) => res.json()),
        ).pipe(
          map((res) => ({
            body: res.body.storage.value,
            format: 'HTML',
          })),
        );
      }
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
