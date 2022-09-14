/// <reference path="../../../../../../node_modules/@types/gapi/index.d.ts" />
/// <reference path="../../../../../../node_modules/@types/gapi.auth2/index.d.ts" />
/// <reference path="../../../../../../node_modules/@types/gapi.client.drive/index.d.ts" />

import {
  ConnectorSettings,
  FileStatus,
  ISourceConnector,
  SourceConnectorDefinition,
  SyncItem,
  SearchResults,
} from '../models';
import { BehaviorSubject, filter, from, map, Observable, of, concatMap, take } from 'rxjs';
import { injectScript } from '@flaps/core';
import { environment } from '../../../environments/environment';

declare var gapi: any;

const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];

const TOKEN = 'GDRIVE_TOKEN';

export const GDrive: SourceConnectorDefinition = {
  id: 'gdrive',
  title: 'Google Drive',
  logo: 'assets/logos/gdrive.svg',
  description: 'File storage and synchronization service developed by Google',
  factory: (data?: ConnectorSettings) => of(new GDriveImpl(data)),
};

class GDriveImpl implements ISourceConnector {
  hasServerSideAuth = true;
  resumable = true;
  private isAuthenticated: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  API_KEY: string;

  constructor(data?: ConnectorSettings) {
    this.API_KEY = data?.API_KEY || '';
  }

  getParameters() {
    return of([]);
  }

  goToOAuth(reset?: boolean) {
    if (reset) {
      localStorage.removeItem(TOKEN);
    }
    const token = localStorage.getItem(TOKEN);
    if (token) {
      injectScript('https://apis.google.com/js/api.js').subscribe(() =>
        gapi.load('client', () => {
          gapi.client.init({
            apiKey: this.API_KEY,
            discoveryDocs: DISCOVERY_DOCS,
          });
          gapi.client.setToken({ access_token: token });
          this.isAuthenticated.next(true);
        }),
      );
    } else {
      if ((window as any)['electron']) {
        (window as any)['electron'].openExternal(
          `${environment.connectors.gdrive.endpoint}?redirect=nuclia-desktop://`,
        );
      } else {
        location.href = `${environment.connectors.gdrive.endpoint}?redirect=http://localhost:4200`;
      }
    }
  }

  authenticate(): Observable<boolean> {
    if (!this.isAuthenticated.getValue()) {
      injectScript('https://apis.google.com/js/api.js').subscribe(() => {
        gapi.load('client', () => {
          gapi.client.init({
            apiKey: this.API_KEY,
            discoveryDocs: DISCOVERY_DOCS,
          });
          const interval = setInterval(() => {
            const deeplink = (window as any)['deeplink'] || location.search;
            if (deeplink && deeplink.includes('?')) {
              const params = new URLSearchParams(deeplink.split('?')[1]);
              const isGoogle = params.get('google');
              if (isGoogle) {
                const token = params.get('token') || '';
                localStorage.setItem(TOKEN, token);
                gapi.client.setToken({ access_token: token });
                clearInterval(interval);
                this.isAuthenticated.next(true);
              }
            }
          }, 500);
        });
      });
    }
    return this.isAuthenticated.asObservable();
  }

  getFiles(query?: string, pageSize?: number) {
    return this._getFiles(query, pageSize);
  }

  private _getFiles(query?: string, pageSize: number = 50, nextPageToken?: string): Observable<SearchResults> {
    return injectScript('https://apis.google.com/js/api.js').pipe(
      filter((isSigned) => isSigned),
      take(1),
      concatMap(() =>
        from(
          gapi.client.drive.files
            .list({
              pageSize,
              pageToken: nextPageToken,
              q: query
                ? `name contains '${query}' and not mimeType = 'application/vnd.google-apps.folder'`
                : `not mimeType = 'application/vnd.google-apps.folder'`,
            })
            .then(
              (res: any) => res,
              () => {
                localStorage.removeItem(TOKEN);
                throw new Error('Unauthorized');
              },
            ),
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
      title: raw.name || '',
      originalId: raw.id || '',
      metadata: { mimeType: raw['mimeType'] },
      status: FileStatus.PENDING,
      uuid: raw.uuid || '',
    };
  }

  download(resource: SyncItem): Observable<Blob> {
    return new Observable<Blob>((observer) => {
      const request = resource.metadata['mimeType'].startsWith('application/vnd.google-apps')
        ? `https://www.googleapis.com/drive/v3/files/${resource.originalId}/export?mimeType=application/pdf&supportsAllDrives=true`
        : `https://www.googleapis.com/drive/v3/files/${resource.originalId}?alt=media&supportsAllDrives=true`;

      injectScript('https://apis.google.com/js/api.js').subscribe(() =>
        gapi.load('client', () =>
          gapi.client
            .init({
              apiKey: this.API_KEY,
              discoveryDocs: DISCOVERY_DOCS,
            })
            .then(() =>
              fetch(request, {
                method: 'GET',
                headers: { Authorization: `Bearer ${gapi.client.getToken().access_token}` },
              })
                .then((response) => response.blob())
                .then((blob) => {
                  observer.next(blob);
                  observer.complete();
                }),
            ),
        ),
      );
    });
  }
}
