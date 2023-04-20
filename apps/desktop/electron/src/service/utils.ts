import path from 'path';

// eslint-disable-next-line no-new-func
const importDynamic = new Function('modulePath', 'return import(modulePath)');

export const fetch = async (...args: any[]) => {
  const module = await importDynamic('node-fetch');
  return module.default(...args);
};

export function getDataPath(filename: string): string {
  switch (process.platform) {
    case 'darwin': {
      return path.join(process.env.HOME || '.', 'Library', 'Application Support', 'nuclia', filename);
    }
    case 'win32': {
      return path.join(process.env.APPDATA || '.', 'nuclia', filename);
    }
    case 'linux': {
      return path.join(process.env.HOME || '.', '.nuclia', filename);
    }
    default: {
      return '.';
    }
  }
}
