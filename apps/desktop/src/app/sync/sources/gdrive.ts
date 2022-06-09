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
  SearchResults,
} from '../models';
import { BehaviorSubject, filter, from, map, Observable, of, concatMap, take, tap, concatMapTo } from 'rxjs';
import { injectScript } from '../inject';

declare var gapi: any;
declare var google: any;

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
const SCOPES = 'https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/drive.readonly';
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];

export const GDrive: SourceConnectorDefinition = {
  id: 'gdrive',
  title: 'Google Drive',
  logo: 'assets/logos/gdrive.svg',
  description: 'File storage and synchronization service developed by Google',
  factory: (data?: ConnectorSettings) => of(new GDriveImpl(data)),
};

class GDriveImpl implements ISourceConnector {
  hasServerSideAuth = true;
  private isAuthenticated: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  API_KEY: string;
  CLIENT_ID: string;

  constructor(data?: ConnectorSettings) {
    this.API_KEY = data?.API_KEY || '';
    this.CLIENT_ID = data?.CLIENT_ID || '';
  }

  goToOAuth() {
    let tokenClient: any;
    injectScript('https://accounts.google.com/gsi/client')
      .pipe(
        tap(
          () => {
            google.accounts.id.initialize({
              client_id: this.CLIENT_ID,
              callback: () => console.log('yepa'),
            });

            // Display the One Tap prompt
            google.accounts.id.prompt();
          },
          // (tokenClient = google.accounts.oauth2.initTokenClient({
          //   client_id: this.CLIENT_ID,
          //   client_secret: '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',
          //   scope: SCOPES,
          //   callback: '', // defined later
          // })),
        ),
        concatMapTo(injectScript('https://apis.google.com/js/api.js')),
      )
      .subscribe(() => {
        gapi.load('client', () => {
          gapi.client
            .init({
              apiKey: this.API_KEY,
              discoveryDocs: DISCOVERY_DOCS,
            })
            .then(() => {
              tokenClient.callback = (resp: any) => {
                if (resp.error !== undefined) {
                  throw resp;
                }
                this.isAuthenticated.next(true);
              };

              // if (gapi.client.getToken() === null) {
              //   // Prompt the user to select a Google Account and ask for consent to share their data
              //   // when establishing a new session.
              //   tokenClient.requestAccessToken({ prompt: 'consent' });
              // } else {
              // Skip display of account chooser and consent dialog for an existing session.
              tokenClient.requestAccessToken({ prompt: 'none' });
              // }
            });
        });
      });
  }

  authenticate(): Observable<boolean> {
    return this.isAuthenticated.asObservable();
  }

  getFiles(query?: string, pageSize?: number) {
    return this._getFiles(query, pageSize);
  }

  private _getFiles(query?: string, pageSize: number = 50, nextPageToken?: string): Observable<SearchResults> {
    return this.authenticate().pipe(
      filter((isSigned) => isSigned),
      take(1),
      concatMap(() =>
        from(
          gapi.client.drive.files.list({
            pageSize,
            pageToken: nextPageToken,
            q: query
              ? `name contains '${query}' and not mimeType = 'application/vnd.google-apps.folder'`
              : `not mimeType = 'application/vnd.google-apps.folder'`,
          }),
        ),
      ),
      /* eslint-disable  @typescript-eslint/no-explicit-any */
      map((res: any) => ({
        items: res.result.files.map(this.map),
        nextPage: res.result.nextPageToken ? this._getFiles(query, pageSize, res.result.nextPageToken) : undefined,
      })),
    );
  }

  /* eslint-disable  @typescript-eslint/no-explicit-any */
  map(raw: any): SyncItem {
    return {
      title: raw?.['name'] || '',
      originalId: raw?.['id'] || '',
      metadata: { mimeType: raw['mimeType'] },
      status: FileStatus.PENDING,
    };
  }

  download(resource: SyncItem): Observable<Blob> {
    return new Observable<Blob>((observer) => {
      const request = resource.metadata['mimeType'].startsWith('application/vnd.google-apps')
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
