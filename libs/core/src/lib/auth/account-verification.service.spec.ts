import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MockProvider } from 'ng-mocks';
import { SDKService } from '../api';
import { AuthService } from './auth.service';
import { AccountVerificationService, PENDING_ACCOUNT_DELETE_KEY } from './account-verification.service';

describe('AccountVerificationService', () => {
  let service: AccountVerificationService;
  let authService: AuthService;
  let sdkService: SDKService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AccountVerificationService,
        MockProvider(SDKService, {
          nuclia: {
            auth: {
              getJWTUser: jest.fn().mockReturnValue(null),
              requestEmailOtp: jest.fn().mockReturnValue(of(undefined)),
              redirectToOAuth: jest.fn(),
            },
          } as any,
        }),
        MockProvider(AuthService, {
          setNextUrl: jest.fn(),
        }),
      ],
    });
    service = TestBed.inject(AccountVerificationService);
    authService = TestBed.inject(AuthService);
    sdkService = TestBed.inject(SDKService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  // ─── getLastVerifiedAt ───────────────────────────────────────────────────────

  describe('getLastVerifiedAt()', () => {
    it('returns null when getJWTUser returns null', () => {
      jest.spyOn(service['sdk'].nuclia.auth, 'getJWTUser').mockReturnValue(null);
      expect(service.getLastVerifiedAt()).toBeNull();
    });

    it('returns null when JWT has no ext.last_verified_at', () => {
      jest.spyOn(service['sdk'].nuclia.auth, 'getJWTUser').mockReturnValue({
        ext: { first_name: 'Test', type: 'microsoft' },
      } as any);
      expect(service.getLastVerifiedAt()).toBeNull();
    });

    it('returns the timestamp when JWT has ext.last_verified_at', () => {
      const timestamp = 1700000000;
      jest.spyOn(service['sdk'].nuclia.auth, 'getJWTUser').mockReturnValue({
        ext: { last_verified_at: timestamp, first_name: 'Test', type: 'microsoft' },
      } as any);
      expect(service.getLastVerifiedAt()).toBe(timestamp);
    });
  });

  // ─── supportsForceReauth ─────────────────────────────────────────────────────

  describe('supportsForceReauth()', () => {
    it('returns false when last_verified_at is absent', () => {
      jest.spyOn(service['sdk'].nuclia.auth, 'getJWTUser').mockReturnValue(null);
      expect(service.supportsForceReauth()).toBe(false);
    });

    it('returns true when last_verified_at is present', () => {
      jest.spyOn(service['sdk'].nuclia.auth, 'getJWTUser').mockReturnValue({
        ext: { last_verified_at: 1700000000, first_name: 'Test', type: 'microsoft' },
      } as any);
      expect(service.supportsForceReauth()).toBe(true);
    });
  });

  // ─── isRecentlyVerified ──────────────────────────────────────────────────────

  describe('isRecentlyVerified()', () => {
    it('returns false when last_verified_at is absent', () => {
      jest.spyOn(service['sdk'].nuclia.auth, 'getJWTUser').mockReturnValue(null);
      expect(service.isRecentlyVerified()).toBe(false);
    });

    it('returns true when last_verified_at is within the last 5 minutes', () => {
      const nowSeconds = Math.floor(Date.now() / 1000);
      const twoMinutesAgo = nowSeconds - 120;
      jest.spyOn(service['sdk'].nuclia.auth, 'getJWTUser').mockReturnValue({
        ext: { last_verified_at: twoMinutesAgo, first_name: 'Test', type: 'microsoft' },
      } as any);
      expect(service.isRecentlyVerified()).toBe(true);
    });

    it('returns false when last_verified_at is more than 5 minutes ago', () => {
      const nowSeconds = Math.floor(Date.now() / 1000);
      const sixMinutesAgo = nowSeconds - 360;
      jest.spyOn(service['sdk'].nuclia.auth, 'getJWTUser').mockReturnValue({
        ext: { last_verified_at: sixMinutesAgo, first_name: 'Test', type: 'microsoft' },
      } as any);
      expect(service.isRecentlyVerified()).toBe(false);
    });
  });

  // ─── forceReauth ────────────────────────────────────────────────────────────

  describe('forceReauth()', () => {
    it('stores the returnUrl in localStorage under PENDING_ACCOUNT_DELETE_KEY', () => {
      service.forceReauth('https://app.example.com/account');
      expect(localStorage.getItem(PENDING_ACCOUNT_DELETE_KEY)).toBe('https://app.example.com/account');
    });

    it('sets the next URL to the returnUrl pathname and redirects through OAuth', () => {
      const returnUrl = 'https://app.example.com/account/delete?from=settings#confirm';
      const setNextUrlSpy = jest.spyOn(authService, 'setNextUrl');
      const redirectToOAuthSpy = jest.spyOn(sdkService.nuclia.auth, 'redirectToOAuth');

      service.forceReauth(returnUrl);

      expect(setNextUrlSpy).toHaveBeenCalledWith('/account/delete');
      expect(redirectToOAuthSpy).toHaveBeenCalledWith(
        { came_from: returnUrl },
        { prompt: 'login', max_age: '0' },
      );
    });
  });

  // ─── hasPendingDelete ────────────────────────────────────────────────────────

  describe('hasPendingDelete()', () => {
    it('returns true when the key exists in localStorage', () => {
      localStorage.setItem(PENDING_ACCOUNT_DELETE_KEY, 'https://app.example.com/account');
      expect(service.hasPendingDelete()).toBe(true);
    });

    it('returns false when the key is absent from localStorage', () => {
      localStorage.removeItem(PENDING_ACCOUNT_DELETE_KEY);
      expect(service.hasPendingDelete()).toBe(false);
    });
  });

  // ─── clearPendingDelete ──────────────────────────────────────────────────────

  describe('clearPendingDelete()', () => {
    it('removes the key from localStorage', () => {
      localStorage.setItem(PENDING_ACCOUNT_DELETE_KEY, 'https://app.example.com/account');
      service.clearPendingDelete();
      expect(localStorage.getItem(PENDING_ACCOUNT_DELETE_KEY)).toBeNull();
    });
  });

  // ─── requestEmailOtp ─────────────────────────────────────────────────────────

  describe('requestEmailOtp()', () => {
    it('delegates to sdk.nuclia.auth.requestEmailOtp()', () => {
      const mockOtp$ = of(undefined);
      const requestEmailOtpSpy = jest
        .spyOn(service['sdk'].nuclia.auth, 'requestEmailOtp')
        .mockReturnValue(mockOtp$);

      const result = service.requestEmailOtp();

      expect(requestEmailOtpSpy).toHaveBeenCalledTimes(1);
      expect(result).toBe(mockOtp$);
    });
  });
});
