import {
  ISourceConnector,
  SourceConnectorDefinition,
  SyncItem,
  SearchResults,
  ConnectorParameters,
  FileStatus,
} from '../models';
import { Observable, of, from, map, filter, switchMap } from 'rxjs';

export const OneDriveConnector: SourceConnectorDefinition = {
  id: 'onedrive',
  factory: () => new OneDriveImpl(),
};

class OneDriveImpl implements ISourceConnector {
  isExternal = true;
  params: ConnectorParameters = {};

  hasAuthData() {
    return !!this.params.token;
  }

  setParameters(params: ConnectorParameters) {
    this.params = params;
  }

  getLastModified(since: string, folders?: SyncItem[] | undefined): Observable<SyncItem[]> {
    throw new Error('Method not implemented.');
  }

  getFolders(query?: string | undefined): Observable<SearchResults> {
    throw new Error('Method not implemented.');
  }

  getFiles(query?: string, pageSize = 50, nextPage?: string): Observable<SearchResults> {
    let path = `https://graph.microsoft.com/v1.0/me/drive/root`;
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

  getLink(resource: SyncItem): Observable<{ uri: string; extra_headers: { [key: string]: string } }> {
    return of({ uri: resource.metadata.downloadLink, extra_headers: {} });
  }

  download(resource: SyncItem): Observable<Blob> {
    throw 'Error';
  }
}
