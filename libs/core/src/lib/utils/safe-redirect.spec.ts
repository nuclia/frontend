import { getSafeRedirectOrigin } from './safe-redirect';

describe('getSafeRedirectOrigin', () => {
  const apiOrigin = 'https://accounts.stashify.cloud';

  it('returns the origin when the url is a subdomain of the same main domain', () => {
    expect(getSafeRedirectOrigin('https://admin.stashify.cloud/at/my-account', apiOrigin)).toBe(
      'https://admin.stashify.cloud',
    );
  });

  it('returns the origin for a multi-label main domain, matching same-suffix subdomains', () => {
    expect(
      getSafeRedirectOrigin(
        'https://admin.gcp-global-dev-1.nuclia.io/at/my-account',
        'https://accounts.gcp-global-dev-1.nuclia.io',
      ),
    ).toBe('https://admin.gcp-global-dev-1.nuclia.io');
  });

  it('rejects a different main domain', () => {
    expect(getSafeRedirectOrigin('https://admin.evil.com/at/my-account', apiOrigin)).toBeNull();
  });

  it('rejects a lookalike domain that only shares a suffix substring', () => {
    expect(getSafeRedirectOrigin('https://notstashify.cloud/at/my-account', apiOrigin)).toBeNull();
  });

  it('rejects a domain-confusion attempt appending the real domain as a subdomain of an attacker domain', () => {
    expect(getSafeRedirectOrigin('https://stashify.cloud.evil.com/at/my-account', apiOrigin)).toBeNull();
  });

  it('rejects http (non-localhost)', () => {
    expect(getSafeRedirectOrigin('http://admin.stashify.cloud/at/my-account', apiOrigin)).toBeNull();
  });

  it('allows http://localhost for local dev, regardless of apiOrigin', () => {
    expect(getSafeRedirectOrigin('http://localhost:4300/at/my-account', apiOrigin)).toBe('http://localhost:4300');
  });

  it('rejects a bare main domain with no subdomain', () => {
    expect(getSafeRedirectOrigin('https://stashify.cloud/at/my-account', apiOrigin)).toBeNull();
  });

  it('returns null for a malformed url', () => {
    expect(getSafeRedirectOrigin('not-a-url', apiOrigin)).toBeNull();
  });

  it('returns null for an empty string', () => {
    expect(getSafeRedirectOrigin('', apiOrigin)).toBeNull();
  });
});
