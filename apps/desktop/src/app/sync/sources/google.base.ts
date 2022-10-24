/// <reference path="../../../../../../node_modules/@types/gapi/index.d.ts" />
/// <reference path="../../../../../../node_modules/@types/gapi.auth2/index.d.ts" />
/// <reference path="../../../../../../node_modules/@types/gapi.client.drive/index.d.ts" />

import { ConnectorSettings } from '../models';
import { BehaviorSubject, Observable } from 'rxjs';
import { injectScript } from '@flaps/core';
import { environment } from '../../../environments/environment';

declare var gapi: any;

const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];

const TOKEN = 'GDRIVE_TOKEN';

export class GoogleBaseImpl {
  hasServerSideAuth = true;
  private isAuthenticated: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  API_KEY: string;

  constructor(data?: ConnectorSettings) {
    this.API_KEY = data?.API_KEY || '';
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
          `${environment.connectors.google.endpoint}?redirect=nuclia-desktop://`,
        );
      } else {
        location.href = `${environment.connectors.google.endpoint}?redirect=http://localhost:4200`;
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
}
