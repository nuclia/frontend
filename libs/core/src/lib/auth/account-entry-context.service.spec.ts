import { TestBed } from '@angular/core/testing';
import { MockProvider } from 'ng-mocks';
import { SDKService } from '../api';
import { BackendConfigurationService } from '../config';
import { AccountEntryContextService, ACCOUNT_ENTRY_CONTEXT_KEY } from './account-entry-context.service';

describe('AccountEntryContextService', () => {
  let service: AccountEntryContextService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AccountEntryContextService,
        MockProvider(BackendConfigurationService, {
          getAPIOrigin: jest.fn().mockReturnValue('https://accounts.stashify.cloud'),
        }),
        MockProvider(SDKService, {
          getOriginForApp: jest.fn().mockReturnValue('https://app.stashify.cloud'),
        } as any),
      ],
    });
    service = TestBed.inject(AccountEntryContextService);
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('captureFromQueryParams()', () => {
    it('does nothing when `from` is null', () => {
      service.captureFromQueryParams(null, 'rao');
      expect(localStorage.getItem(ACCOUNT_ENTRY_CONTEXT_KEY)).toBeNull();
    });

    it('does nothing when `from` fails the safe-redirect check', () => {
      service.captureFromQueryParams('https://evil.com/at/my-account', 'rao');
      expect(localStorage.getItem(ACCOUNT_ENTRY_CONTEXT_KEY)).toBeNull();
    });

    it('stores returnUrl + originClient when `from` is safe and `app` is known', () => {
      service.captureFromQueryParams('https://rao.stashify.cloud/at/my-account', 'rao');
      expect(JSON.parse(localStorage.getItem(ACCOUNT_ENTRY_CONTEXT_KEY)!)).toEqual({
        returnUrl: 'https://rao.stashify.cloud/at/my-account',
        originClient: 'rao',
      });
    });

    it('defaults originClient to "dashboard" when `app` is missing or unknown', () => {
      service.captureFromQueryParams('https://dashboard.stashify.cloud/at/my-account', 'not-a-real-app');
      expect(JSON.parse(localStorage.getItem(ACCOUNT_ENTRY_CONTEXT_KEY)!).originClient).toBe('dashboard');
    });
  });

  describe('get()', () => {
    it('returns null when nothing was captured', () => {
      expect(service.get()).toBeNull();
    });

    it('returns null when the stored value is malformed JSON', () => {
      localStorage.setItem(ACCOUNT_ENTRY_CONTEXT_KEY, '{not-json');
      expect(service.get()).toBeNull();
    });

    it('returns null when the stored originClient is not a known client', () => {
      localStorage.setItem(
        ACCOUNT_ENTRY_CONTEXT_KEY,
        JSON.stringify({ returnUrl: 'https://dashboard.stashify.cloud', originClient: 'not-a-real-app' }),
      );
      expect(service.get()).toBeNull();
    });

    it('returns the parsed context when valid', () => {
      const context = { returnUrl: 'https://rao.stashify.cloud/at/my-account', originClient: 'rao' };
      localStorage.setItem(ACCOUNT_ENTRY_CONTEXT_KEY, JSON.stringify(context));
      expect(service.get()).toEqual(context);
    });
  });

  describe('getReturnUrl()', () => {
    it('returns the captured returnUrl when present', () => {
      localStorage.setItem(
        ACCOUNT_ENTRY_CONTEXT_KEY,
        JSON.stringify({ returnUrl: 'https://rao.stashify.cloud/at/my-account', originClient: 'rao' }),
      );
      expect(service.getReturnUrl()).toBe('https://rao.stashify.cloud/at/my-account');
    });

    it('falls back to the rag app origin when nothing was captured', () => {
      expect(service.getReturnUrl()).toBe('https://app.stashify.cloud');
    });
  });
});
