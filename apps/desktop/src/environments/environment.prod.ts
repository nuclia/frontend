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
    nucliacloud: {
      backend: 'https://nuclia.cloud/api',
      client: 'desktop',
      zone: 'europe-1',
    },
  },
};
