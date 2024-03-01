export function getDeeplink(): string {
  let deeplink = (window as any)['deeplink'] || location.search;
  if (!deeplink && location.href.includes('#')) {
    const path = location.href.split('#')[1];
    deeplink = path.includes('?') ? '?' + path.split('?')[1] : '?' + path;
  }
  if (deeplink && deeplink.includes('#') && !deeplink.includes('?')) {
    deeplink = deeplink.replace('#', '?');
  }
  return deeplink;
}

export function clearDeeplink(): void {
  (window as any)['deeplink'] = undefined;
}
