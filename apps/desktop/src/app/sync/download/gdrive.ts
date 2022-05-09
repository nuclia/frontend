/// <reference path="../../../../../../node_modules/@types/gapi/index.d.ts" />
/// <reference path="../../../../../../node_modules/@types/gapi.auth2/index.d.ts" />
/// <reference path="../../../../../../node_modules/@types/gapi.client.drive/index.d.ts" />

import { IDownloadConnector, Resource } from '../models';
import { BehaviorSubject, filter, from, map, Observable, switchMap, take } from 'rxjs';
import { injectScript } from '../inject';

declare var gapi: any;

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
const SCOPES = 'https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/drive.readonly';
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];

export class GDrive implements IDownloadConnector {
  private isAuthenticated: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  data: { [key: string]: string };
  constructor(data: { [key: string]: string }) {
    this.data = data;
  }

  authenticate(): Observable<boolean> {
    if (!this.isAuthenticated.getValue()) {
      injectScript('https://apis.google.com/js/api.js').subscribe(() => {
        gapi.load('client:auth2', () => {
          gapi.client
            .init({
              apiKey: this.data.API_KEY,
              clientId: this.data.CLIENT_ID,
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

  disconnect() {
    if (gapi) {
      gapi.auth2.getAuthInstance().signOut();
    }
  }

  getFiles(query?: string): Observable<Resource[]> {
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
  map(raw: any): Resource {
    return {
      title: raw?.['name'] || '',
      originalId: raw?.['id'] || '',
      type: raw['mimeType'],
    };
  }

  download(resource: Resource): Observable<Blob> {
    return new Observable<Blob>((observer) => {
      if (resource.type.startsWith('application/vnd.google-apps')) {
        gapi.client.drive.files
          .export({ fileId: resource.originalId, mimeType: 'application/pdf' })
          .then((res: any) => {
            observer.next(new Blob([res.body], { type: 'application/pdf' }));
            observer.complete();
          });
      } else {
        gapi.client.drive.files.get({ fileId: resource.originalId, alt: 'media' }).then((res: any) => {
          observer.next(new Blob([res.body], { type: resource.type }));
          observer.complete();
        });
      }
    });
  }
}
