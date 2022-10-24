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
import { GoogleBaseImpl } from './google.base';

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

class GDriveImpl extends GoogleBaseImpl implements ISourceConnector {
  isExternal = false;
  resumable = true;

  constructor(data?: ConnectorSettings) {
    super(data);
  }

  getParameters() {
    return of([]);
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
