export const environment = {
  production: true,
  client: 'desktop',
  dashboard: 'https://nuclia.cloud',
  backend: {
    social_login: true,
    new_api: true,
  },
  locales: ['en-US', 'es', 'ca'],
  connectors: {
    dropbox: {
      CLIENT_ID: '__DROPBOX_KEY__',
    },
    gdrive: {
      CLIENT_ID: '__GOOGLE_CLIENT_ID__',
      API_KEY: '__GOOGLE_API_KEY__',
    },
    nucliacloud: {
      backend: 'https://nuclia.cloud/api',
      client: 'desktop',
      zone: 'europe-1',
    },
  },
};
