export function replaceSubdomainInUrl(mainBackend: string, prefix?: string): string {
  if (!prefix) {
    return mainBackend;
  }
  if (mainBackend.includes('//accounts.')) {
    return mainBackend.replace('//accounts.', `//${prefix}.`);
  } else {
    return mainBackend.replace('//', `//${prefix}.`);
  }
}

export function setZoneInRegionalUrl(url: string, zone?: string, regionalPrefix?: string): string {
  if (!zone) {
    return url;
  }
  const regionalBase = replaceSubdomainInUrl(url, regionalPrefix || 'rag');
  return replaceSubdomainInUrl(regionalBase, zone);
}
