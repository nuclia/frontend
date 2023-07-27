import express, { Express } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { router } from './routes';
import { sync } from './sync';
import * as Sentry from '@sentry/node';
import { environment } from '../environments/environment';
import { initLog } from './logging';

const app: Express = express();
const port = 5001;

export const initSyncService = () => {
  initLog();
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

  app.use(
    cors({
      origin: '*',
    }),
  );
  app.use(function (req, res, next) {
    res.setHeader('Content-Type', 'application/json');
    next();
  });
  app.use(bodyParser.json());
  app.use('/', router);

  sync();

  app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
  });
};
