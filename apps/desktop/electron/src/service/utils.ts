import path from 'path';

// eslint-disable-next-line no-new-func
const importDynamic = new Function('modulePath', 'return import(modulePath)');

export const fetch = async (...args: any[]) => {
  const module = await importDynamic('node-fetch');
  return module.default(...args);
};

export function getDataPath(filename: string): string {
  const home = process.env.ELECTRON_HOME;
  switch (process.platform) {
    case 'darwin': {
      return path.join(home || process.env.HOME || '.', 'Library', 'Application Support', 'nuclia', filename);
    }
    case 'win32': {
      return path.join(home || process.env.APPDATA || '.', 'nuclia', filename);
    }
    case 'linux': {
      return path.join(home || process.env.HOME || '.', '.nuclia', filename);
    }
    default: {
      return path.join('.', filename);
    }
  }
}
