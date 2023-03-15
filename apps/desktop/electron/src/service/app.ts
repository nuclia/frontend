import express, { Express } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { router } from './routes';
import { sync } from './sync';

const app: Express = express();
const port = 5001;

export const initSyncService = () => {
  app.use(
    cors({
      origin: '*',
    }),
  );
  app.use(bodyParser.json());
  app.use('/', router);

  sync();

  app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
  });
};
