import { Injectable } from '@angular/core';
import * as Sentry from '@sentry/angular';
import { browserTracingIntegration } from '@sentry/angular';
import { firstValueFrom, from } from 'rxjs';
import { map } from 'rxjs/operators';

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
    cdn: string;
    brand_name?: string;
    noStripe: boolean;
    assetsPath?: string;
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
              integrations: [browserTracingIntegration()],
              tracesSampleRate: 5.0,
            });
            Sentry.withScope((scope) => {
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
          config.backend.cdn = staticEnv.standalone ? 'https://cdn.nuclia.cloud' : config.backend.cdn;
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
  searchWidget.src = `${cdnUrl}/nuclia-widget.umd.js`;
  searchWidget.onload = () => (JS_INJECTED = true);
  window.document.body.appendChild(searchWidget);
}
