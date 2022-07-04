import { Injectable } from '@angular/core';
import { firstValueFrom, from } from 'rxjs';
import { map } from 'rxjs/operators';
import * as Sentry from '@sentry/angular';
import { Integrations } from '@sentry/tracing';

export type EnvironmentConfiguration = {
  version: string;
  backend: {
    app: string;
    api: string;
    siteKey: string;
    sentry_environment: string;
    sentry_url: string;
    sentry_backend: string;
    posthog_key: string;
    posthog_host: string;
    cdn?: string;
    saml_login?: boolean;
    allowed_hosts_redirect?: string[];
  };
  stashify: {
    editor: string;
    email_domain: string;
  };
  graphql: string | undefined;
};

export type StaticEnvironmentConfiguration = {
  production: boolean;
  client: string;
  backend: {
    social_login: boolean;
    oauth_login?: boolean;
    new_api?: boolean;
  };
  base_asset_url?: string;
  locales?: string[]; // List of registred locales in the app
  demoKb: string;
};

declare var window: any;
@Injectable()
export class AppInitService {
  // This is the method you want to call at bootstrap
  // Important: It should return a Promise
  public init() {
    return firstValueFrom(
      from(
        fetch('assets/deployment/app-config.json').then(function (response) {
          return response.json();
        }),
      ).pipe(
        map((config) => {
          if (config.production) {
            Sentry.init({
              dsn: config.backend.sentry_url,
              integrations: [
                new Integrations.BrowserTracing({
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
          const apiOrigin = config.production
            ? location.origin.replace('manage.', '').replace('auth.', '')
            : config.backend.apiOrigin;
          config.backend.api = apiOrigin + config.backend.apiPath;
          config.backend.cdn = apiOrigin.replace('//', '//cdn.');
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
  const script = window.document.createElement('script');
  script.type = 'text/javascript';
  script.async = true;
  script.defer = true;
  script.src = `${cdnUrl}/nuclia-widget.umd.js`;
  script.onload = () => (JS_INJECTED = true);
  window.document.body.appendChild(script);
}
