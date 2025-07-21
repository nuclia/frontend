const API_URL = 'https://nuclia.cloud/api';
const DASHBOARD_URL = 'https://nuclia.cloud';

const SETTINGS = { NUCLIA_ACCOUNT: '', NUCLIA_KB: '', NUCLIA_TOKEN: '', ZONE: '' };

// Service workers doesn't support localStorage, so a custom one is created.
localStorage = getStorage();

function getSDK(token, zone) {
  const sdk = new NucliaSDK.Nuclia({
    backend: API_URL,
    client: 'chrome_extension',
    zone,
  });
  sdk.auth.authenticate({
    access_token: token,
    refresh_token: '', // At the moment we don't mind about token refresh
  });
  return sdk;
}

function getLoginUrl() {
  const settingsUrl = chrome.runtime.getURL('options/options.html');
  return `${DASHBOARD_URL}/redirect?redirect=${settingsUrl}&fromExtension=true`;
}

function getStorage() {
  let _storage = {};
  return {
    getItem: (key) => _storage[key],
    setItem: (key, value) => {
      _storage[key] = value;
    },
    removeItem: (key) => {
      _storage[key] = undefined;
    },
    clear: () => {
      _storage = {};
    },
  };
}

function getSettings() {
  return chrome.storage.local.get(SETTINGS);
}
