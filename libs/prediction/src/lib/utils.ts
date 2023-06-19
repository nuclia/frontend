let CDN = 'https://cdn.nuclia.cloud/';
export const setCDN = (cdn: string) => (CDN = cdn);
export const getCDN = () => CDN;

// TO ENABLE DEBUGGING, GO TO YOUR BROWSER CONSOLE AND TYPE:
// localStorage.setItem('nuclia_debug', 'true');
export const logger =
  isLocalStorageAvailable() && localStorage.getItem('nuclia_debug') === 'true' ? console.log : () => {};

function isLocalStorageAvailable() {
  try {
    localStorage.getItem('nuclia_debug');
    return true;
  } catch (e) {
    return false;
  }
}
