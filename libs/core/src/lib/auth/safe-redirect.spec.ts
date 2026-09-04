import { getSafeRedirectOrigin, isSafeRedirect } from './safe-redirect';

describe('safe redirect', () => {
  const apiOrigin = 'https://accounts.stashify.cloud';

  describe('getSafeRedirectOrigin', () => {
    it('should accept a sibling app on the backend parent domain', () => {
      expect(getSafeRedirectOrigin('https://rag.stashify.cloud', apiOrigin)).toBe('https://rag.stashify.cloud');
      expect(getSafeRedirectOrigin('https://rao.stashify.cloud', apiOrigin)).toBe('https://rao.stashify.cloud');
    });

    it('should keep the port and drop any path or query', () => {
      expect(getSafeRedirectOrigin('https://rag.stashify.cloud:8443/at/foo?x=1', apiOrigin)).toBe(
        'https://rag.stashify.cloud:8443',
      );
    });

    it('should reject a different domain', () => {
      expect(getSafeRedirectOrigin('https://rag.evil.com', apiOrigin)).toBeNull();
      expect(getSafeRedirectOrigin('https://stashify.cloud.evil.com', apiOrigin)).toBeNull();
    });

    it('should reject other http hosts and non-http schemes', () => {
      expect(getSafeRedirectOrigin('http://rag.stashify.cloud', apiOrigin)).toBeNull();
      expect(getSafeRedirectOrigin('http://localhost.evil.com', apiOrigin)).toBeNull();
      expect(getSafeRedirectOrigin('javascript:alert(1)', apiOrigin)).toBeNull();
    });

    it('should allow http on localhost for local development', () => {
      expect(getSafeRedirectOrigin('http://localhost:4200', apiOrigin)).toBe('http://localhost:4200');
    });

    it('should return null rather than throwing on malformed input', () => {
      expect(getSafeRedirectOrigin('not a url', apiOrigin)).toBeNull();
      expect(getSafeRedirectOrigin('', apiOrigin)).toBeNull();
      expect(getSafeRedirectOrigin(null, apiOrigin)).toBeNull();
      expect(getSafeRedirectOrigin(undefined, apiOrigin)).toBeNull();
    });

    it('should reject a bare domain with no parent domain to compare', () => {
      expect(getSafeRedirectOrigin('https://localhost', apiOrigin)).toBeNull();
    });
  });

  describe('isSafeRedirect', () => {
    it('should mirror getSafeRedirectOrigin', () => {
      expect(isSafeRedirect('https://rag.stashify.cloud', apiOrigin)).toBe(true);
      expect(isSafeRedirect('https://rag.evil.com', apiOrigin)).toBe(false);
      expect(isSafeRedirect('not a url', apiOrigin)).toBe(false);
    });
  });
});
