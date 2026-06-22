export function replaceSubdomainInUrl(mainBackend: string, prefix?: string): string {
  if (!prefix) {
    return mainBackend;
  }
  if (mainBackend.includes('//accounts.')) {
    return mainBackend.replace('//accounts.', `//${prefix}.`);
  } else if (mainBackend.includes('//rag.')) {
    return mainBackend.replace('//rag.', `//${prefix}.`);
  } else {
    return mainBackend.replace('//', `//${prefix}.`);
  }
}

/**
 * Canonical global backend used by the SDK.
 *
 * Legacy deployments may still pass `rag.<domain>` as backend.
 * Global endpoints must target `accounts.<domain>`, so we normalize here.
 */
export function normalizeGlobalBackendUrl(url: string): string {
  if (url.includes('//rag.')) {
    return url.replace('//rag.', '//accounts.');
  }
  return url;
}

export function setZoneInRegionalUrl(url: string, zone?: string, regionalPrefix?: string): string {
  if (!zone) {
    return url;
  }
  const regionalBase = replaceSubdomainInUrl(url, regionalPrefix || 'dp');
  return replaceSubdomainInUrl(regionalBase, zone);
}
