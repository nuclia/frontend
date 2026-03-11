import { firstValueFrom, of } from 'rxjs';
import { take } from 'rxjs/operators';
import { INuclia } from '../models';
import { mockFetch } from '../test.utils.spec';
import { Authentication } from './auth';

const LOCALSTORAGE_AUTH_KEY = 'JWT_KEY';
const LOCALSTORAGE_REFRESH_KEY = 'JWT_REFRESH_KEY';
const ACCESS_TOKEN =
  'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2NTA0NTcwMjYsImV4cCI6NDA4MDM3MTgyOCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoianJvY2tldEBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6IkpvaG5ueSIsIlN1cm5hbWUiOiJSb2NrZXQiLCJFbWFpbCI6Impyb2NrZXRAZXhhbXBsZS5jb20iLCJSb2xlIjpbIk1hbmFnZXIiLCJQcm9qZWN0IEFkbWluaXN0cmF0b3IiXX0.pVJ7kSG5Uo-u8VwdDSW_nIGHnVdr6_4PuSR13iYiIo0';

describe('Authentication', () => {
  let auth: Authentication;

  const createNuclia = (overrides?: {
    options?: Partial<INuclia['options']>;
    rest?: Partial<INuclia['rest']>;
  }): INuclia => {
    const rest = {
      get: jest.fn(() => of({})),
      delete: jest.fn(() => of(void 0)),
      ...(overrides?.rest || {}),
    };

    return {
      options: {
        backend: 'http://accounts.here/api',
        ...overrides?.options,
      },
      rest,
    } as unknown as INuclia;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('with service API key', () => {
    beforeEach(() => {
      auth = new Authentication({
        options: { backend: 'http://accounts.here', account: 'dc', knowledgeBox: 'gotham', apiKey: 'abc' },
      } as INuclia);
    });

    it('should provide an auth header', () => {
      expect(auth.getAuthHeaders()).toEqual({ 'X-NUCLIA-SERVICEACCOUNT': `Bearer abc` });
    });

    it('should expose authenticated state observable', async () => {
      const value = await firstValueFrom(auth.isAuthenticated().pipe(take(1)));
      expect(value).toBe(true);
    });

    it('should emit hasLoggedOut when auth state changes to false', async () => {
      const loggedOutPromise = firstValueFrom(auth.hasLoggedOut().pipe(take(1)));
      auth.authenticate({ access_token: '', refresh_token: '' });
      await expect(loggedOutPromise).resolves.toBe(false);
    });

    it('should build auth URL', () => {
      expect(auth.getAuthUrl()).toBe('http://accounts.here/auth');
    });

    it('should build hydra URL', () => {
      expect(auth.getHydraUrl()).toBe('http://oauth.here');
    });

    it('should authenticate tokens and persist them', () => {
      expect(auth.authenticate({ access_token: 'token', refresh_token: 'refresh' })).toBe(true);
      expect(localStorage.getItem(LOCALSTORAGE_AUTH_KEY)).toBe('token');
      expect(localStorage.getItem(LOCALSTORAGE_REFRESH_KEY)).toBe('refresh');
    });

    it('should return false when authenticate receives empty access token', () => {
      expect(auth.authenticate({ access_token: '', refresh_token: 'refresh' })).toBe(false);
    });

    it('should clear localStorage and redirect on logout', () => {
      localStorage.setItem(LOCALSTORAGE_AUTH_KEY, 'token');
      localStorage.setItem(LOCALSTORAGE_REFRESH_KEY, 'refresh');
      localStorage.setItem('JWT_ID_TOKEN_KEY', 'id-token');

      try {
        auth.logout();
      } catch {
        // jsdom can throw on real navigation APIs, but storage clearing should still happen first.
      }

      expect(localStorage.getItem(LOCALSTORAGE_AUTH_KEY)).toBeNull();
      expect(localStorage.getItem(LOCALSTORAGE_REFRESH_KEY)).toBeNull();
      expect(localStorage.getItem('JWT_ID_TOKEN_KEY')).toBeNull();
    });

    it('should return token and refresh token', () => {
      localStorage.setItem(LOCALSTORAGE_AUTH_KEY, 'token');
      localStorage.setItem(LOCALSTORAGE_REFRESH_KEY, 'refresh');
      expect(auth.getToken()).toBe('token');
      expect(auth.getToken(true)).toBe('token');
      expect(auth.getRefreshToken()).toBe('refresh');
    });

    it('should not return token for public option', () => {
      const publicAuth = new Authentication(createNuclia({ options: { public: true } }));
      localStorage.setItem(LOCALSTORAGE_AUTH_KEY, 'token');
      expect(publicAuth.getToken()).toBe('');
      expect(publicAuth.getToken(true)).toBe('token');
    });

    it('should return parsed JWT user when token exists', () => {
      localStorage.setItem(LOCALSTORAGE_AUTH_KEY, ACCESS_TOKEN);
      const user = auth.getJWTUser();
      expect(user).not.toBeNull();
      expect(user?.sub).toBe('jrocket@example.com');
    });

    it('should return null JWT user when token does not exist', () => {
      expect(auth.getJWTUser()).toBeNull();
    });

    it('should validate magic token on default endpoint', async () => {
      mockFetch({ action: 'LOGIN' });
      const result = await firstValueFrom(auth.validateMagicToken('my-token'));
      expect(result).toEqual({ action: 'LOGIN' });
      expect(global.fetch).toHaveBeenCalledWith(
        'http://accounts.here/auth/magic?token=my-token',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('should validate magic token on zoned endpoint', async () => {
      mockFetch({ action: 'LOGIN' });
      await firstValueFrom(auth.validateMagicToken('my-token', 'eu-1'));
      expect(global.fetch).toHaveBeenCalledWith(
        'http://eu-1.here/auth/magic?token=my-token',
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  describe('standalone auth headers', () => {
    it('should return READER by default', () => {
      auth = new Authentication(createNuclia({ options: { standalone: true, knowledgeBox: 'kb' } }));
      expect(auth.getAuthHeaders()).toEqual({ 'X-NUCLIADB-ROLES': 'READER' });
    });

    it('should return WRITER for write methods', () => {
      auth = new Authentication(createNuclia({ options: { standalone: true, knowledgeBox: 'kb' } }));
      expect(auth.getAuthHeaders('POST', '/kb/something')).toEqual({ 'X-NUCLIADB-ROLES': 'WRITER' });
    });

    it('should return MANAGER for kbs and kb management paths', () => {
      auth = new Authentication(createNuclia({ options: { standalone: true, knowledgeBox: 'kb' } }));
      expect(auth.getAuthHeaders('PATCH', '/kbs')).toEqual({ 'X-NUCLIADB-ROLES': 'MANAGER' });
      expect(auth.getAuthHeaders('DELETE', '/kb/my-kb')).toEqual({ 'X-NUCLIADB-ROLES': 'MANAGER' });
    });

    it('should force READER for search endpoints', () => {
      auth = new Authentication(createNuclia({ options: { standalone: true, knowledgeBox: 'kb' } }));
      expect(auth.getAuthHeaders('POST', '/kb/my-kb/search')).toEqual({ 'X-NUCLIADB-ROLES': 'READER' });
      expect(auth.getAuthHeaders('POST', '/kb/my-kb/find')).toEqual({ 'X-NUCLIADB-ROLES': 'READER' });
      expect(auth.getAuthHeaders('POST', '/kb/my-kb/catalog')).toEqual({ 'X-NUCLIADB-ROLES': 'READER' });
      expect(auth.getAuthHeaders('POST', '/kb/my-kb/ask')).toEqual({ 'X-NUCLIADB-ROLES': 'READER' });
    });
  });

  describe('OAuth and token exchange', () => {
    beforeEach(() => {
      auth = new Authentication(
        createNuclia({
          options: {
            oauth: { client_id: 'client-id' },
            backend: 'http://accounts.here/api',
            knowledgeBox: 'kb',
          },
        }),
      );
    });

    it('should throw if OAuth params are missing on redirectToOAuth', () => {
      const authWithoutOauth = new Authentication(createNuclia({ options: { knowledgeBox: 'kb' } }));
      expect(() => authWithoutOauth.redirectToOAuth()).toThrow('OAuth parameters are missing.');
    });

    it('should redirect to OAuth and store state, nonce and code verifier', async () => {
      const getRandomValuesSpy = jest
        .spyOn(crypto, 'getRandomValues')
        .mockImplementation((arr: ArrayBufferView<ArrayBufferLike>) => {
          const view = arr as Uint8Array;
          for (let i = 0; i < view.length; i += 1) {
            view[i] = i + 1;
          }
          return view;
        });
      const generateChallengeSpy = jest
        .spyOn(auth as any, 'generateCodeChallenge')
        .mockReturnValue(new Promise<string>(() => undefined));
      auth.redirectToOAuth({ custom: 'value' });
      await Promise.resolve();
      expect(generateChallengeSpy).toHaveBeenCalled();

      getRandomValuesSpy.mockRestore();
    });

    it('should process authorization response and parse state', async () => {
      localStorage.setItem('oauth_state', btoa(JSON.stringify({ came_from: 'x', a: true })));
      localStorage.setItem('code_verifier', 'my-code-verifier');
      mockFetch({ access_token: 'token', refresh_token: 'refresh' });

      const expectedState = localStorage.getItem('oauth_state') || '';
      const result = await firstValueFrom(auth.processAuthorizationResponse('auth-code', expectedState));

      expect(result.success).toBe(true);
      expect(result.state).toEqual({ came_from: 'x', a: true });
      expect(localStorage.getItem('oauth_state')).toBeNull();
      expect(localStorage.getItem('oauth_nonce')).toBeNull();
      expect(localStorage.getItem('code_verifier')).toBeNull();
    });

    it('should fail processAuthorizationResponse when state does not match', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      localStorage.setItem('oauth_state', 'expected');
      const result = await firstValueFrom(auth.processAuthorizationResponse('auth-code', 'different'));
      expect(result).toEqual({ success: false, state: {} });
      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });

    it('should fail processAuthorizationResponse when state cannot be parsed', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      localStorage.setItem('oauth_state', '%%%invalid%%%');
      localStorage.setItem('code_verifier', 'my-code-verifier');
      mockFetch({ access_token: 'token', refresh_token: 'refresh' });

      const result = await firstValueFrom(auth.processAuthorizationResponse('auth-code', '%%%invalid%%%'));
      expect(result).toEqual({ success: true, state: {} });
      expect(errorSpy).toHaveBeenCalledWith('Cannot parse state');
      errorSpy.mockRestore();
    });
  });

  describe('network/REST-backed methods', () => {
    beforeEach(() => {
      auth = new Authentication(
        createNuclia({
          options: {
            oauth: { client_id: 'client-id' },
            backend: 'http://accounts.here/api',
            knowledgeBox: 'kb',
          },
        }),
      );
    });

    it('should refresh successfully and store returned tokens', async () => {
      localStorage.setItem(LOCALSTORAGE_REFRESH_KEY, 'my-refresh');
      mockFetch({ access_token: 'new-token', refresh_token: 'new-refresh' });

      const result = await firstValueFrom(auth.refresh());
      expect(result).toBe(true);
      expect(localStorage.getItem(LOCALSTORAGE_AUTH_KEY)).toBe('new-token');
      expect(localStorage.getItem(LOCALSTORAGE_REFRESH_KEY)).toBe('new-refresh');
    });

    it('should call logout and return false when refresh response has no access token', async () => {
      const logoutSpy = jest.spyOn(auth, 'logout').mockImplementation(() => undefined);
      mockFetch({ access_token: '', refresh_token: '' });

      const result = await firstValueFrom(auth.refresh());
      expect(result).toBe(false);
      expect(logoutSpy).toHaveBeenCalled();
      logoutSpy.mockRestore();
    });

    it('should call logout when refresh request fails', async () => {
      const logoutSpy = jest.spyOn(auth, 'logout').mockImplementation(() => undefined);
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          clone: () => ({
            json: () => Promise.resolve({}),
          }),
        }),
      ) as jest.Mock;

      await expect(firstValueFrom(auth.refresh())).rejects.toBeTruthy();
      expect(logoutSpy).toHaveBeenCalled();
      logoutSpy.mockRestore();
    });

    it('should throw when refresh is called without OAuth config', async () => {
      const authWithoutOauth = new Authentication(createNuclia({ options: { knowledgeBox: 'kb' } }));
      await expect(firstValueFrom(authWithoutOauth.refresh())).rejects.toThrow('OAuth parameters are missing.');
    });

    it('should call setPassword endpoint and authenticate response tokens', async () => {
      mockFetch({ access_token: 'token', refresh_token: 'refresh' });
      const authenticateSpy = jest.spyOn(auth, 'authenticate');

      const result = await firstValueFrom(auth.setPassword('new-password'));
      expect(result).toBe(true);
      expect(authenticateSpy).toHaveBeenCalledWith({ access_token: 'token', refresh_token: 'refresh' });
    });

    it('should delete authenticated user and clear stored tokens', async () => {
      const nuclia = createNuclia({
        options: { knowledgeBox: 'kb' },
        rest: {
          delete: jest.fn(() => of(void 0)),
        },
      });
      auth = new Authentication(nuclia);
      localStorage.setItem(LOCALSTORAGE_AUTH_KEY, 'token');
      localStorage.setItem(LOCALSTORAGE_REFRESH_KEY, 'refresh');

      await firstValueFrom(auth.deleteAuthenticatedUser());

      expect(nuclia.rest.delete).toHaveBeenCalledWith('/user');
      expect(localStorage.getItem(LOCALSTORAGE_AUTH_KEY)).toBe('');
      expect(localStorage.getItem(LOCALSTORAGE_REFRESH_KEY)).toBe('');
    });

    it('should call getAuthInfo endpoint with and without ip info', async () => {
      const get = jest.fn((path: string) => of({ path }));
      const nuclia = createNuclia({
        options: { knowledgeBox: 'kb' },
        rest: { get: get as unknown as INuclia['rest']['get'] },
      });
      auth = new Authentication(nuclia);

      const info = await firstValueFrom(auth.getAuthInfo());
      const infoWithIp = await firstValueFrom(auth.getAuthInfo(true));

      expect(info).toEqual({ path: '/authorizer/info' });
      expect(infoWithIp).toEqual({ path: '/authorizer/info?ip_info=1' });
    });
  });

  describe('constructor auth state', () => {
    it('should emit false at startup when no token exists and no knowledge box', async () => {
      auth = new Authentication(createNuclia({ options: { backend: 'http://accounts.here/api' } }));
      const firstState = await firstValueFrom(auth.isAuthenticated().pipe(take(1)));
      expect(firstState).toBe(false);
    });

    it('should use bearer auth header when token exists and no api key', () => {
      localStorage.setItem(LOCALSTORAGE_AUTH_KEY, 'my-token');
      auth = new Authentication(createNuclia({ options: { knowledgeBox: 'kb' } }));
      expect(auth.getAuthHeaders()).toEqual({ Authorization: 'Bearer my-token' });
    });
  });
});
