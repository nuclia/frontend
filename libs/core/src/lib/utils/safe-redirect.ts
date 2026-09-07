/**
 * Security boundary against open-redirect: only allow `https:` (or `http://localhost` for
 * local dev) origins that share the backend's main domain. Returns the normalized origin, or
 * `null` if `url` doesn't qualify.
 */
export function getSafeRedirectOrigin(url: string, apiOrigin: string): string | null {
  try {
    const parsed = new URL(url);
    const isHttps = parsed.protocol === 'https:';
    const isLocalhost = parsed.protocol === 'http:' && parsed.hostname === 'localhost';

    if (!isHttps && !isLocalhost) return null;
    if (isLocalhost) return `${parsed.protocol}//${parsed.host}`;

    const backendMainDomain = apiOrigin.split('/')[2]?.split('.').slice(1).join('.');
    const urlMainDomain = parsed.hostname.split('.').slice(1).join('.');

    if (!backendMainDomain || urlMainDomain !== backendMainDomain) return null;
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return null;
  }
}
