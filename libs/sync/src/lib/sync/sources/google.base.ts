/// <reference path="../../../../../../node_modules/@types/gapi/index.d.ts" />
/// <reference path="../../../../../../node_modules/@types/gapi.auth2/index.d.ts" />
/// <reference path="../../../../../../node_modules/@types/gapi.client.drive/index.d.ts" />

import { ConnectorParameters, Field } from '../models';
import { combineLatest, from, Observable, of, take, tap } from 'rxjs';
import { injectScript } from '@flaps/core';

declare var gapi: any;

const CREDENTIALS = 'GOOGLE_CREDENTIALS';
export class GoogleBaseImpl {
  DISCOVERY_DOCS: string[] = [];
  hasServerSideAuth = false;
  token = '';

  goToOAuth(reset?: boolean) {
    return of(true);
  }

  authenticate(): Observable<boolean> {
    return of(true);
  }

  getParameters(): Observable<Field[]> {
    return of([
      {
        id: 'credentials',
        label: 'Service Account Credentials',
        type: 'textarea',
        required: true,
      },
    ]);
  }

  handleParameters(params: ConnectorParameters) {
    localStorage.setItem(CREDENTIALS, params.credentials);
  }

  getToken(): Observable<string> {
    if (!(window as any)['electron']) {
      throw 'Not running in electron';
    } else {
      if (this.token) {
        return of(this.token);
      } else {
        return (
          from(
            (window as any)['electron'].google.getToken(JSON.parse(localStorage.getItem(CREDENTIALS) || '{}')).then(
              (token: string) => token,
              () => {
                throw new Error('Unauthorized');
              },
            ),
          ) as Observable<string>
        ).pipe(tap((token) => (this.token = token)));
      }
    }
  }

  getClient(): Observable<any> {
    return new Observable<Blob>((observer) => {
      combineLatest([
        this.getToken().pipe(take(1)),
        injectScript('https://apis.google.com/js/api.js').pipe(take(1)),
      ]).subscribe({
        next: ([token]) => {
          gapi.load('client', () => {
            gapi.client.setToken({ access_token: token });
            gapi.client
              .init({
                discoveryDocs: this.DISCOVERY_DOCS,
              })
              .then(
                () => {
                  observer.next(gapi.client);
                  observer.complete();
                },
                (err: any) => {
                  console.error('Cannot initialize gapi client', err);
                  observer.error(err);
                },
              );
          });
        },
        error: (err) => observer.error(err),
      });
    });
  }
}
