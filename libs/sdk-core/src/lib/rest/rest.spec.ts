import { Nuclia } from '../core';
import { mockFetch, mockReadableStream } from '../test.utils.spec';
import { Rest } from './rest';

describe('Rest', () => {
  let rest: Rest;
  beforeEach(() => {
    const nuclia = new Nuclia({
      backend: 'http://accounts.here',
      zone: 'europe-1',
      account: 'dc',
      knowledgeBox: 'gotham',
    });
    nuclia.auth.getAuthHeaders = () => ({ Authorization: 'Bearer 12345' });
    rest = nuclia.rest as Rest;
  });

  it('should GET', (done) => {
    mockFetch({ id: 'abc', title: 'Gödel, Escher, Bach: an Eternal Golden Braid' });
    rest.get<{ id: string; title: string }>('/somepath').subscribe((res) => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://europe-1.here/v1/somepath',
        expect.objectContaining({
          headers: { Authorization: 'Bearer 12345', 'content-type': 'application/json', 'x-ndb-client': 'web' },
          method: 'GET',
        }),
      );
      expect(res.id).toEqual('abc');
      done();
    });
  });

  it('should POST', (done) => {
    mockFetch({});
    rest
      .post<{ id: string; title: string }>('/somepath', {
        id: 'abc',
        title: 'Gödel, Escher, Bach: an Eternal Golden Braid',
      })
      .subscribe(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'http://europe-1.here/v1/somepath',
          expect.objectContaining({
            body: '{"id":"abc","title":"Gödel, Escher, Bach: an Eternal Golden Braid"}',
            headers: { Authorization: 'Bearer 12345', 'content-type': 'application/json', 'x-ndb-client': 'web' },
            method: 'POST',
          }),
        );
        done();
      });
  });

  it('should PUT', (done) => {
    mockFetch({});
    rest
      .put<{ id: string; title: string }>('/somepath', {
        id: 'abc',
        title: 'Gödel, Escher, Bach: an Eternal Golden Braid',
      })
      .subscribe(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'http://europe-1.here/v1/somepath',
          expect.objectContaining({
            body: '{"id":"abc","title":"Gödel, Escher, Bach: an Eternal Golden Braid"}',
            headers: { Authorization: 'Bearer 12345', 'content-type': 'application/json', 'x-ndb-client': 'web' },
            method: 'PUT',
          }),
        );
        done();
      });
  });

  it('should PATCH', (done) => {
    mockFetch({});
    rest
      .patch<{ id: string; title: string }>('/somepath', {
        id: 'abc',
        title: 'Gödel, Escher, Bach: an Eternal Golden Braid',
      })
      .subscribe(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'http://europe-1.here/v1/somepath',
          expect.objectContaining({
            body: '{"id":"abc","title":"Gödel, Escher, Bach: an Eternal Golden Braid"}',
            headers: { Authorization: 'Bearer 12345', 'content-type': 'application/json', 'x-ndb-client': 'web' },
            method: 'PATCH',
          }),
        );
        done();
      });
  });

  it('should DELETE', (done) => {
    mockFetch('');
    rest.delete<{ id: string; title: string }>('/somepath').subscribe(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://europe-1.here/v1/somepath',
        expect.objectContaining({
          headers: { Authorization: 'Bearer 12345', 'content-type': 'application/json', 'x-ndb-client': 'web' },
          method: 'DELETE',
        }),
      );
      done();
    });
  });

  it('should not prefix domain with zone for global endpoints', (done) => {
    mockFetch({});
    rest.get('/account').subscribe(() => {
      expect(global.fetch).toHaveBeenCalledWith('http://accounts.here/v1/account', expect.anything());
      done();
    });
  });

  it('should get readable stream', (done) => {
    mockReadableStream(['abc', 'def'], { index: 0 });
    rest.getStreamedResponse('/somepath', {}).subscribe((res) => {
      if (!res.incomplete) {
        const encoder = new TextEncoder();
        const expected = encoder.encode('abcdef');
        expect(res.data).toEqual(expected);
        done();
      }
    });
  });
});
