import { TestBed } from '@angular/core/testing';
import { BackendConfigurationService, OAuthService } from '@flaps/core';
import { fallbackRedirectGuard } from './fallback-redirect.guard';

describe('fallbackRedirectGuard', () => {
  const originalLocation = window.location;
  let location: { href: string; pathname: string; search: string };
  let cameFrom: string;

  beforeEach(() => {
    location = {
      href: 'https://auth.nuclia.cloud/user/onboarding?foo=bar',
      pathname: '/user/onboarding',
      search: '?foo=bar',
    };
    Object.defineProperty(window, 'location', { configurable: true, value: location });
    cameFrom = 'https://rag.nuclia.cloud';
    TestBed.configureTestingModule({
      providers: [
        { provide: OAuthService, useValue: { getCameFrom: () => cameFrom } },
        { provide: BackendConfigurationService, useValue: { getAPIOrigin: () => 'https://europe-1.nuclia.cloud/api' } },
      ],
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
  });

  function run() {
    return TestBed.runInInjectionContext(() => fallbackRedirectGuard());
  }

  it('should redirect to the originating app keeping path and query when the domain matches the backend', () => {
    expect(run()).toBe(false);
    expect(location.href).toBe('https://rag.nuclia.cloud/user/onboarding?foo=bar');
  });

  it('should allow the 404 page when the origin belongs to another domain', () => {
    cameFrom = 'https://rag.evil.com';
    expect(run()).toBe(true);
    expect(location.href).toBe('https://auth.nuclia.cloud/user/onboarding?foo=bar');
  });

  it('should allow the 404 page for non-https origins other than localhost', () => {
    cameFrom = 'http://rag.nuclia.cloud';
    expect(run()).toBe(true);
  });

  it('should allow the 404 page when cameFrom is not a valid URL', () => {
    cameFrom = 'not a url';
    expect(run()).toBe(true);
  });
});
