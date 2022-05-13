/// <reference path="../../../../../../node_modules/@types/gapi/index.d.ts" />
/// <reference path="../../../../../../node_modules/@types/gapi.auth2/index.d.ts" />
/// <reference path="../../../../../../node_modules/@types/gapi.client.drive/index.d.ts" />

import {
  ConnectorDefinition,
  ConnectorSettings,
  FileStatus,
  ISourceConnector,
  SourceConnectorDefinition,
  SyncItem,
} from '../models';
import { BehaviorSubject, filter, from, map, Observable, of, switchMap, take } from 'rxjs';
import { injectScript } from '../inject';

declare var gapi: any;

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
const SCOPES = 'https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/drive.readonly';
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];

export const GDrive: SourceConnectorDefinition = {
  id: 'gdrive',
  title: 'Google Drive',
  logo: 'assets/logos/gdrive.png',
  description: 'File storage and synchronization service developed by Google',
  factory: (data?: ConnectorSettings) => of(new GDriveImpl(data)),
};

class GDriveImpl implements ISourceConnector {
  private isAuthenticated: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  API_KEY: string;
  CLIENT_ID: string;

  constructor(data?: ConnectorSettings) {
    this.API_KEY = data?.API_KEY || '';
    this.CLIENT_ID = data?.CLIENT_ID || '';
  }

  authenticate(): Observable<boolean> {
    if (!this.isAuthenticated.getValue()) {
      injectScript('https://apis.google.com/js/api.js').subscribe(() => {
        gapi.load('client:auth2', () => {
          gapi.client
            .init({
              apiKey: this.API_KEY,
              clientId: this.CLIENT_ID,
              discoveryDocs: DISCOVERY_DOCS,
              scope: SCOPES,
              // redirect_uri: 'http://localhost:4200/redirect',
              // ux_mode: 'redirect',
            })
            .then(() => {
              gapi.auth2.getAuthInstance().signIn();
              this.isAuthenticated.next(!!gapi.auth2.getAuthInstance().isSignedIn.get());
              gapi.auth2
                .getAuthInstance()
                .isSignedIn.listen((isSigned: boolean) => this.isAuthenticated.next(isSigned));
            });
        });
      });
    }
    return this.isAuthenticated.asObservable();
  }

  getFiles(query?: string): Observable<SyncItem[]> {
    return this.authenticate().pipe(
      filter((isSigned) => isSigned),
      take(1),
      switchMap(() =>
        from(
          gapi.client.drive.files.list({
            pageSize: 50,
            q: query
              ? `name contains '${query}' and not mimeType = 'application/vnd.google-apps.folder'`
              : `not mimeType = 'application/vnd.google-apps.folder'`,
          }),
        ),
      ),
      /* eslint-disable  @typescript-eslint/no-explicit-any */
      map((res: any) => res.result.files.map(this.map)),
    );
  }

  /* eslint-disable  @typescript-eslint/no-explicit-any */
  map(raw: any): SyncItem {
    return {
      title: raw?.['name'] || '',
      originalId: raw?.['id'] || '',
      type: raw['mimeType'],
      status: FileStatus.PENDING,
    };
  }

  download(resource: SyncItem): Observable<Blob> {
    return new Observable<Blob>((observer) => {
      const request = resource.type.startsWith('application/vnd.google-apps')
        ? `https://www.googleapis.com/drive/v3/files/${resource.originalId}/export?mimeType=application/pdf&supportsAllDrives=true`
        : `https://www.googleapis.com/drive/v3/files/${resource.originalId}?alt=media&supportsAllDrives=true`;

      fetch(request, {
        method: 'GET',
        headers: { Authorization: `Bearer ${gapi.client.getToken().access_token}` },
      })
        .then((response) => response.blob())
        .then((blob) => {
          observer.next(blob);
          observer.complete();
        });
    });
  }
}
