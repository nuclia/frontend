import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import { getDataPath } from './utils';

const connectorsPath = getDataPath('remote-connectors');

export const importConnector = (url: string) => {
  if (!fs.existsSync(connectorsPath)) {
    fs.mkdirSync(connectorsPath);
  }
  const filename = url.split('/').pop() || 'connector.js';
  const filepath = path.join(connectorsPath, filename);
  if (!fs.existsSync(filepath)) {
    const file = fs.createWriteStream(path.join(connectorsPath, filename));
    https.get(url, (response) => {
      response.pipe(file);

      file.on('finish', () => {
        file.close();
        console.log('Download Completed');
      });
    });
  }
};

(global as any).registerConnector = (connector: any) => {
  console.log(connector);
};
export const loadConnectors = () => {
  if (!fs.existsSync(connectorsPath)) {
    return;
  }
  fs.readdirSync(connectorsPath).forEach((file) => {
    const filePath = path.join(connectorsPath, file);
    import(filePath).then((module) => {
      // console.log(module);
    });
  });
};
