import {
  ISourceConnector,
  SourceConnectorDefinition,
  SyncItem,
  SearchResults,
  ConnectorParameters,
  FileStatus,
  Field,
} from '../models';
import { Observable, of, from, map, BehaviorSubject, filter, switchMap } from 'rxjs';
import { getDeeplink } from '../../utils';

const SCOPE = 'https://graph.microsoft.com/files.read offline_access';

export const OneDriveConnector: SourceConnectorDefinition = {
  id: 'onedrive',
  title: 'One Drive',
  logo: 'assets/logos/onedrive.svg',
  description: 'Microsoft OneDrive file hosting service',
  factory: () => of(new OneDriveImpl()),
};

const CLIENT_ID = 'ONEDRIVE_CLIENT_ID';
const CLIENT_SECRET = 'ONEDRIVE_CLIENT_SECRET';
const TOKEN = 'ONEDRIVE_TOKEN';

class OneDriveImpl implements ISourceConnector {
  hasServerSideAuth = true;
  isExternal = true;
  resumable = false;
  private isAuthenticated: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  isAuthError = (error: any) => error.code === 'InvalidAuthenticationToken';

  getParameters(): Observable<Field[]> {
    return of([
      {
        id: 'client_id',
        label: 'Client id',
        type: 'text',
        required: true,
      },
      {
        id: 'client_secret',
        label: 'Client secret',
        type: 'text',
        required: true,
      },
    ]);
  }

  handleParameters(params: ConnectorParameters) {
    localStorage.setItem(CLIENT_ID, params.client_id);
    localStorage.setItem(CLIENT_SECRET, params.client_secret);
  }

  goToOAuth(reset?: boolean) {
    if (reset) {
      localStorage.removeItem(TOKEN);
    }
    const token = localStorage.getItem(TOKEN);
    if (!token) {
      if ((window as any)['electron']) {
        (window as any)['electron'].openExternal(
          `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${localStorage.getItem(
            CLIENT_ID,
          )}&scope=${SCOPE}
          &response_type=token&redirect_uri=nuclia-desktop://index.html`,
        );
      } else {
        location.href = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${localStorage.getItem(
          CLIENT_ID,
        )}&scope=${SCOPE}
        &response_type=token&redirect_uri=http://localhost:4200`;
      }
    } else {
      this.isAuthenticated.next(true);
    }
  }

  authenticate(): Observable<boolean> {
    if (!this.isAuthenticated.getValue()) {
      const interval = setInterval(() => {
        const deeplink = getDeeplink();
        if (deeplink && deeplink.includes('?')) {
          const params = new URLSearchParams(deeplink.split('?')[1]);
          const token = params.get('access_token') || '';
          clearInterval(interval);
          if (token) {
            localStorage.setItem(TOKEN, token);
            this.isAuthenticated.next(true);
          }
        }
      }, 500);
    }
    return this.isAuthenticated.asObservable();
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
    return this.isAuthenticated.pipe(
      filter((isAuth) => isAuth),
      switchMap(() =>
        from(
          fetch(path, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem(TOKEN)}`,
            },
          }).then((res) => res.json()),
        ),
      ),
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
