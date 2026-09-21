// Warning: this key name is declared in both dashboard app.init and in @nuclia/sync
// to avoid making a dependency
const PENDING_NEW_CONNECTOR_KEY = 'PENDING_NEW_CONNECTOR';

// Warning: This check must run before AppComponent is initialized.
// Otherwise a race condition occurs in Safari, breaking the oauth flow redirect.
export function checkExternalConnection(): Promise<void> {
  const params = location.search;
  const externalConnectionId = new URLSearchParams(params).get('external_connection_id');
  if (!externalConnectionId) {
    return Promise.resolve();
  }
  try {
    const redirect = JSON.parse(localStorage.getItem(PENDING_NEW_CONNECTOR_KEY) || '{}')['redirect'];
    if (typeof redirect === 'string') {
      location.href = `${redirect}/${externalConnectionId}`;
      return new Promise<void>(() => undefined); // Stop AppComponent initialization
    } else {
      // DEV PURPOSE
      // when working on localhost, the oauth flow redirect to stage, we need to know external_connection_id
      // so we can pass it manuallly to localhost
      console.info('external_connection_id', externalConnectionId);
      return Promise.resolve();
    }
  } catch {
    return Promise.resolve();
  }
}
