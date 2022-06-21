import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SDKService } from '@flaps/auth';
import { injectScript } from '@flaps/core';
import { take, tap, concatMapTo } from 'rxjs';

declare var gapi: any;
declare var google: any;

const SCOPES = 'https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/drive.readonly';
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
@Component({
  template: 'Redirecting to Nuclia Desktop…',
})
export class RedirectComponent {
  constructor(private sdk: SDKService, private route: ActivatedRoute) {
    this.route.queryParams.pipe(take(1)).subscribe((params) => {
      let redirectUrl: string = params['redirect'] || '';
      if (params['google']) {
        this.goToGoogleOAuth(redirectUrl, params['API_KEY'], params['CLIENT_ID']);
      } else {
        redirectUrl += redirectUrl.includes('?') ? '&' : '?';
        const tokens = `access_token=${this.sdk.nuclia.auth.getToken()}&refresh_token=${this.sdk.nuclia.auth.getRefreshToken()}`;
        location.href = redirectUrl + tokens;
      }
    });
  }

  goToGoogleOAuth(redirectUrl: string, apiKey: string, clientId: string) {
    let tokenClient: any;
    injectScript('https://accounts.google.com/gsi/client')
      .pipe(
        tap(
          () =>
            (tokenClient = google.accounts.oauth2.initTokenClient({
              client_id: clientId,
              scope: SCOPES,
              callback: '', // defined later
            })),
        ),
        concatMapTo(injectScript('https://apis.google.com/js/api.js')),
      )
      .subscribe(() => {
        gapi.load('client', () => {
          gapi.client
            .init({
              apiKey,
              discoveryDocs: DISCOVERY_DOCS,
            })
            .then(() => {
              tokenClient.callback = (resp: any) => {
                if (resp.error !== undefined) {
                  throw resp;
                }
                location.href = `${redirectUrl}?google=${encodeURIComponent(JSON.stringify(resp))}`;
              };

              if (gapi.client.getToken() === null) {
                tokenClient.requestAccessToken({ prompt: 'consent' });
              } else {
                tokenClient.requestAccessToken({ prompt: 'none' });
              }
            });
        });
      });
  }
}
