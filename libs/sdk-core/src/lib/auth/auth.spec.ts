import { filter, switchMap, tap } from 'rxjs/operators';
import { Nuclia } from '../core';
import { INuclia } from '../models';
import { mockFetch } from '../test.utils.spec';
import { Authentication } from './auth';

const LOCALSTORAGE_AUTH_KEY = 'JWT_KEY';
const LOCALSTORAGE_REFRESH_KEY = 'JWT_REFRESH_KEY';
const ACCESS_TOKEN =
  'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2NTA0NTcwMjYsImV4cCI6NDA4MDM3MTgyOCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoianJvY2tldEBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6IkpvaG5ueSIsIlN1cm5hbWUiOiJSb2NrZXQiLCJFbWFpbCI6Impyb2NrZXRAZXhhbXBsZS5jb20iLCJSb2xlIjpbIk1hbmFnZXIiLCJQcm9qZWN0IEFkbWluaXN0cmF0b3IiXX0.pVJ7kSG5Uo-u8VwdDSW_nIGHnVdr6_4PuSR13iYiIo0';

describe('Authentication', () => {
  let auth: Authentication;

  describe('with regular credentials', () => {
    beforeEach(() => {
      const nuclia = new Nuclia({
        backend: 'http://here',
        zone: 'europe-1',
        account: 'dc',
        knowledgeBox: 'gotham',
        oauth: {
          client_id: 'abc123',
          hydra: 'http://oauth.here',
          auth: 'http://auth.here',
        },
      });
      auth = nuclia.auth as Authentication;
    });

    // it('should login', (done) => {
    //   mockFetch({ access_token: ACCESS_TOKEN, refresh_token: 'qwerty' });
    //   auth.login('test', 'test').subscribe(() => {
    //     expect(global.fetch).toHaveBeenCalledWith(
    //       'http://here/auth/login',
    //       expect.objectContaining({ body: '{"username":"test","password":"test"}', method: 'POST' }),
    //     );
    //     expect(localStorage.getItem(LOCALSTORAGE_AUTH_KEY)).toEqual(ACCESS_TOKEN);
    //     expect(localStorage.getItem(LOCALSTORAGE_REFRESH_KEY)).toEqual('qwerty');
    //     expect(auth.getAuthHeaders()).toEqual({ Authorization: `Bearer ${ACCESS_TOKEN}` });
    //     done();
    //   });
    // });

    it('should emit isAuthenticated', (done) => {
      mockFetch({ access_token: ACCESS_TOKEN, refresh_token: 'qwerty' });
      auth.login('test', 'test').subscribe();
      auth
        .isAuthenticated()
        .pipe(filter((isAuth) => isAuth))
        .subscribe((isAuth) => {
          expect(isAuth).toBe(true);
          done();
        });
    });

    // it('should logout', (done) => {
    //   mockFetch({ access_token: ACCESS_TOKEN, refresh_token: 'qwerty' });
    //   auth
    //     .login('test', 'test')
    //     .pipe(
    //       tap(() => auth.logout()),
    //       switchMap(() => auth.isAuthenticated()),
    //       filter((isAuth) => !isAuth),
    //     )
    //     .subscribe((isAuth) => {
    //       expect(isAuth).toBe(false);
    //       expect(global.fetch).toHaveBeenCalledWith(
    //         'http://here/auth/logout',
    //         expect.objectContaining({
    //           headers: { Authorization: `Bearer ${ACCESS_TOKEN}`, 'content-type': 'application/json' },
    //           method: 'POST',
    //         }),
    //       );
    //       expect(localStorage.getItem(LOCALSTORAGE_AUTH_KEY)).toBeFalsy();
    //       done();
    //     });
    // });

    // it('should refresh', (done) => {
    //   mockFetch({ access_token: ACCESS_TOKEN, refresh_token: 'qwerty' });
    //   auth
    //     .login('test', 'test')
    //     .pipe(switchMap(() => auth.refresh()))
    //     .subscribe(() => {
    //       expect(global.fetch).toHaveBeenCalledWith(
    //         'http://here/auth/refresh',
    //         expect.objectContaining({
    //           headers: { Authorization: `Bearer ${ACCESS_TOKEN}`, 'content-type': 'application/json' },
    //           method: 'POST',
    //           body: '{"refresh_token":"qwerty"}',
    //         }),
    //       );
    //       expect(localStorage.getItem(LOCALSTORAGE_AUTH_KEY)).toEqual(ACCESS_TOKEN);
    //       expect(localStorage.getItem(LOCALSTORAGE_REFRESH_KEY)).toEqual('qwerty');
    //       done();
    //     });
    // });
  });

  describe('with service API key', () => {
    beforeEach(() => {
      auth = new Authentication({
        options: { backend: 'http://here', account: 'dc', knowledgeBox: 'gotham', apiKey: 'abc' },
      } as INuclia);
    });

    it('should provide an auth header', () => {
      expect(auth.getAuthHeaders()).toEqual({ 'X-NUCLIA-SERVICEACCOUNT': `Bearer abc` });
    });
  });
});
