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
