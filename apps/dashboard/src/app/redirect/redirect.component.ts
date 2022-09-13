import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SDKService } from '@flaps/core';
import { injectScript } from '@flaps/core';
import { take, tap, concatMapTo } from 'rxjs';

declare var gapi: any;
declare var google: any;

const AUTHORIZED_REDIRECTS = ['nuclia-desktop://', 'http://localhost:4200'];
const AUTHORIZED_REDIRECTS_REGEX = [/^chrome\-extension\:\/\/[a-z]+\/options\/options\.html$/];


const SCOPES = 'https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/drive.readonly';
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
@Component({
  template:
    '{{ fromChromeExtension ?  "Redirecting to Nuclia Chrome extension…" : "Redirecting to Nuclia Desktop…" }}',
})
export class RedirectComponent {
  fromChromeExtension = false;
  constructor(private sdk: SDKService, private route: ActivatedRoute) {
    this.route.queryParams.pipe(take(1)).subscribe((params) => {
      if (params['fromExtension']) {
        this.fromChromeExtension = true;
      }
      let redirectUrl: string = params['redirect'] || '';
      const matchRegex = AUTHORIZED_REDIRECTS_REGEX.some(regex => regex.test(redirectUrl));
      if (!matchRegex && !AUTHORIZED_REDIRECTS.includes(redirectUrl)) {
        console.warn('Redirect URL not authorized');
        return;
      }
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
