/**
 * Shared validation for redirect targets coming from untrusted input
 * (`came_from` query params, stored values, OAuth state).
 *
 * A target is safe when it is a well-formed https URL (or http on localhost for
 * local development) that shares the backend's parent domain, so a login can
 * hand off to a sibling app such as `rag.` or `rao.` but never to an attacker
 * controlled host.
 */

/**
 * Returns the `protocol//host` of `url` when it is a safe redirect target for
 * the given backend origin, otherwise null. Never throws, whatever `url` holds.
 */
export function getSafeRedirectOrigin(url: string | null | undefined, apiOrigin: string): string | null {
  if (!url) {
    return null;
  }
  try {
    const parsed = new URL(url);
    const origin = `${parsed.protocol}//${parsed.host}`;
    if (parsed.protocol === 'http:' && parsed.hostname === 'localhost') {
      // Local dev servers have no parent domain to compare, so allow them outright.
      return origin;
    }
    if (parsed.protocol !== 'https:') {
      return null;
    }
    const backendMainDomain = getParentDomain(new URL(apiOrigin).hostname);
    const urlMainDomain = getParentDomain(parsed.hostname);
    if (!backendMainDomain || urlMainDomain !== backendMainDomain) {
      return null;
    }
    return origin;
  } catch {
    return null;
  }
}

/** True when `url` is a safe redirect target for the given backend origin. */
export function isSafeRedirect(url: string | null | undefined, apiOrigin: string): boolean {
  return getSafeRedirectOrigin(url, apiOrigin) !== null;
}

function getParentDomain(hostname: string): string {
  return hostname.split('.').slice(1).join('.');
}
