import { Injectable } from '@angular/core';
import { firstValueFrom, from } from 'rxjs';
import { map } from 'rxjs/operators';
import * as Sentry from '@sentry/angular';

export type EnvironmentConfiguration = {
  version: string;
  remoteLogin?: boolean;
  backend: {
    app: string;
    api: string;
    apiOrigin?: string;
    oauth?: string;
    siteKey?: string;
    sentry_environment?: string;
    sentry_url?: string;
    sentry_backend?: string;
    posthog_key?: string;
    posthog_host?: string;
    cdn?: string;
    allowed_hosts_redirect?: string[];
  };
};

export type StaticEnvironmentConfiguration = {
  production: boolean;
  client: string;
  backend: {
    social_login: boolean;
    oauth_login?: boolean;
    new_api?: boolean;
    oauth?: string;
  };
  base_asset_url?: string;
  locales?: string[]; // List of registred locales in the app
  standalone?: boolean;
};

declare var window: any;
@Injectable()
export class AppInitService {
  // This is the method you want to call at bootstrap
  // Important: It should return a Promise
  public init(staticEnv: StaticEnvironmentConfiguration) {
    return firstValueFrom(
      from(
        fetch(`assets/deployment/app-config.json?t=${Date.now()}`).then(function (response) {
          return response.json();
        }),
      ).pipe(
        map((config) => {
          if (config.production) {
            Sentry.init({
              dsn: config.backend.sentry_url,
              integrations: [
                new Sentry.BrowserTracing({
                  tracingOrigins: [config.backend.sentry_backend],
                  routingInstrumentation: Sentry.routingInstrumentation,
                }),
              ],
              tracesSampleRate: 5.0,
            });
            Sentry.configureScope((scope) => {
              scope.addEventProcessor((event) => {
                event.environment = config.backend.sentry_environment;
                event.release = config.version;
                return event;
              });
            });
          }
          // on a prod build, this code can run on stage, nuclia.cloud or in electron app
          // - when stage or nuclia.cloud, the backend is the same as the current domain
          // - when electron, the backend is the one we have in the config
          const apiOrigin =
            config.production && location.origin.startsWith('http')
              ? location.origin.replace('manage.', '').replace('auth.', '')
              : config.backend.apiOrigin;
          config.backend.apiOrigin = apiOrigin;
          config.backend.api = apiOrigin + config.backend.apiPath;
          config.backend.cdn = staticEnv.standalone ? 'https://cdn.nuclia.cloud' : apiOrigin.replace('//', '//cdn.');
          if (config.backend.cdn && !JS_INJECTED) {
            injectWidget(config.backend.cdn);
          }
          window.config = config;
        }),
      ),
    );
  }

  public getConfig(): EnvironmentConfiguration {
    return window.config;
  }
}

let JS_INJECTED = false;
function injectWidget(cdnUrl: string) {
  const searchWidget = window.document.createElement('script');
  searchWidget.type = 'text/javascript';
  searchWidget.async = true;
  searchWidget.defer = true;
  searchWidget.src = `${cdnUrl}/nuclia-video-widget.umd.js`;
  searchWidget.onload = () => (JS_INJECTED = true);
  window.document.body.appendChild(searchWidget);

  const viewer = window.document.createElement('script');
  viewer.type = 'text/javascript';
  viewer.async = true;
  viewer.defer = true;
  viewer.src = `${cdnUrl}/nuclia-viewer-widget.umd.js`;
  window.document.body.appendChild(viewer);

  const popup = window.document.createElement('script');
  popup.type = 'text/javascript';
  popup.async = true;
  popup.defer = true;
  popup.src = `${cdnUrl}/nuclia-popup-widget.umd.js`;
  window.document.body.appendChild(popup);
}
