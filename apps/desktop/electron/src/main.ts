import SquirrelEvents from './app/events/squirrel.events';
import ElectronEvents from './app/events/electron.events';
import { app, BrowserWindow } from 'electron';
import App from './app/app';
import * as Sentry from '@sentry/electron';
import { environment } from './environments/environment';

export default class Main {
  static initialize() {
    if (SquirrelEvents.handleEvents()) {
      // squirrel event handled (except first run event) and app will exit in 1000ms, so don't do anything else
      app.quit();
    }
  }

  static bootstrapApp() {
    App.main(app, BrowserWindow);
  }

  static bootstrapAppEvents() {
    ElectronEvents.bootstrapElectronEvents();

    // initialize auto updater service
    if (!App.isDevelopmentMode()) {
      // UpdateEvents.initAutoUpdateService();
    }
  }
}

const sentryUrl = environment.sentry_url;
if (sentryUrl) {
  Sentry.init({ dsn: sentryUrl });
  Sentry.configureScope((scope) => {
    scope.addEventProcessor((event) => {
      event.environment = environment.sentry_environment || 'desktop-dev';
      event.release = environment.sentry_release || '0.0-dev';
      return event;
    });
  });
}

// handle setup events as quickly as possible
Main.initialize();

// bootstrap app
Main.bootstrapApp();
Main.bootstrapAppEvents();
