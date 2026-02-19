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
        backend: 'http://accounts.here',
        zone: 'europe-1',
        account: 'dc',
        knowledgeBox: 'gotham',
        oauth: {
          client_id: 'abc123',
        },
      });
      auth = nuclia.auth as Authentication;
    });

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
  });
});
