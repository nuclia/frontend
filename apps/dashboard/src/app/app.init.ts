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
    const pending = JSON.parse(localStorage.getItem(PENDING_NEW_CONNECTOR_KEY) || '{}');
    const redirect = pending['redirect'];
    if (typeof redirect === 'string') {
      // Context Box's ShareFile entry point resumes into its own route (`/simple`) with the
      // connection id as a query param, instead of the Sync feature's `/add/:connector/:syncId`
      // path-segment convention — see SimpleKBService.connectShareFile().
      location.href = pending['contextBox']
        ? `${redirect}${redirect.includes('?') ? '&' : '?'}external_connection_id=${externalConnectionId}`
        : `${redirect}/${externalConnectionId}`;
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
