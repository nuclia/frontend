export function getDeeplink(): string {
  let deeplink = (window as any)['deeplink'] || location.search;
  if (!deeplink && location.href.includes('#')) {
    deeplink = '?' + location.href.split('#')[1];
  }
  if (deeplink && deeplink.includes('#') && !deeplink.includes('?')) {
    deeplink = deeplink.replace('#', '?');
  }
  return deeplink;
}

export async function sha256(message: string) {
  // encode as UTF-8
  const msgBuffer = new TextEncoder().encode(message);

  // hash the message
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);

  // convert ArrayBuffer to Array
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  // convert bytes to hex string
  const hashHex = hashArray.map((b) => ('00' + b.toString(16)).slice(-2)).join('');
  return hashHex;
}
