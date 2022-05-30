export const environment = {
  production: true,
  client: 'desktop',
  dashboard: 'https://stashify.cloud',
  backend: {
    social_login: true,
    new_api: true,
  },
  locales: ['en-US', 'es', 'ca'],
  connectors: {
    dropbox: {
      CLIENT_ID: 'kaqruhinfl76dar',
    },
    gdrive: {
      CLIENT_ID: '422664282538-m7mf0hh07h8u93kacss0f4clhnpp656v.apps.googleusercontent.com',
      API_KEY: 'AIzaSyDeDskGoRmFQNofNXwg66zYoa3pNPQJM2Q',
    },
    nucliacloud: {
      backend: 'https://stashify.cloud/api',
      client: 'desktop',
      zone: 'europe-1',
      // TODO: create a key on first launch when the API allows to create several
      zoneKey:
        'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6InprIn0.eyJpc3MiOiJodHRwczovL3N0YXNoaWZ5LmNsb3VkLyIsImV4cCI6MjUzMzcwNzY0ODAwLCJpYXQiOjE2NTIzMzkyOTEsInN1YiI6IjlhOGRmMWU2LWYyNzAtNGFiZS1iMTA2LWQ2ZTcwNWMwZTk0ZSIsImtleSI6IjQyMWJmY2QyLWI0ZmEtNDcwNy04NmQ5LTQ1YjBiNjgwNzFjMSJ9.oqiieZopJjsoEMUzLGwU0drb9Sux9xtPyaqDdhVQ21DEZ5YV9rx-NFFn8T4N_Gp3Moem5_EFo6acCgrMP0VoMftdG4pwp9fALWWlzrs0tPKWLMB_tliNC78wTLrEoWGWtB4Souww8BaFnS0NlUIjqkjRwX5S6tbSViAPhb7eEOMz_MM4ehDxduvCSr-qrkhe4DISih5OHzaw_7XsWHmO2BSsf_u0P1y9SNGhDhRDqLSkWxtKOEmGaGwyTJQaWolIfvUy4mVXbALXwjPDc6V9d2xqucH0q_gmrSUh5QWjUVaxv-ggxgN6cPmp4_ztaT-2WCyLNJ7kbtuPj_CTHF4NtP_0kLAI0TbiVTVAqffAzo2iy_LJcsJ1cnsqFMKoaRDl1DHo6KtOVXxQeJ3-uhuGyRHu7hm06_N4IP_gYvWV-eKvr5gS4GFQja8S2vNtdSpDv57xmFUmq5U5WkpVuPXk7Rm91R758wIgHRYpMtTfGd_ykjHDQ3P9agQcAyciD9cJp4a0Cde4Cp2sbF1kM0W8lwUwHfsh8eeC7xTSzfkI80hlJRnOQG56IOMXs-sAQu0TuaEvO4_qasDc22e3G3v3mesUFeG2ugiVFOb_uXQVLszrONW6zX3IYM9s0C_8EWOyPHgLhZlL9ziGlIaOGotg5fZKII99IRT21A1amnr58Ck',
    },
  },
};
