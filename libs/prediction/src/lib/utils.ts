let CDN = 'https://cdn.nuclia.cloud/';
export const setCDN = (cdn: string) => (CDN = cdn);
export const getCDN = () => CDN;

// TO ENABLE DEBUGGING, GO TO YOUR BROWSER CONSOLE AND TYPE:
// localStorage.setItem('nuclia_debug', 'true');
export const logger = localStorage.getItem('nuclia_debug') === 'true' ? console.log : () => {};
