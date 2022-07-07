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
      CLIENT_ID: 'z178e757arn1jvo',
    },
    gdrive: {
      CLIENT_ID: '422664282538-m7mf0hh07h8u93kacss0f4clhnpp656v.apps.googleusercontent.com',
      API_KEY: 'AIzaSyDeDskGoRmFQNofNXwg66zYoa3pNPQJM2Q',
    },
    nucliacloud: {
      backend: 'https://stashify.cloud/api',
      client: 'desktop',
      zone: 'europe-1',
    },
  },
};
