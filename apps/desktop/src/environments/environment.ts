export const environment = {
  production: false,
  client: 'desktop',
  dashboard: 'https://stashify.cloud',
  backend: {
    social_login: true,
    new_api: true,
  },
  locales: ['en-US', 'es', 'ca'],
  connectors: {
    dropbox: {
      CLIENT_ID: 'FAKE',
    },
    gdrive: {
      endpoint: 'http://127.0.0.1:5000/gdrive/authorize',
      API_KEY: 'FAKE',
    },
    nucliacloud: {
      backend: 'https://stashify.cloud/api',
      client: 'desktop',
      zone: 'europe-1',
    },
  },
};
