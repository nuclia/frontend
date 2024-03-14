export function getURLParams(): string {
  let params = location.search;
  if (!params && location.href.includes('#')) {
    const path = location.href.split('#')[1];
    params = path.includes('?') ? '?' + path.split('?')[1] : '?' + path;
  }
  if (params && params.includes('#') && !params.includes('?')) {
    params = params.replace('#', '?');
  }
  return params;
}
