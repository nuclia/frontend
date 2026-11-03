import { filter, firstValueFrom } from 'rxjs';
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

  it('should GET', async () => {
    mockFetch({ id: 'abc', title: 'Gödel, Escher, Bach: an Eternal Golden Braid' });
    const res = await firstValueFrom(rest.get<{ id: string; title: string }>('/somepath'));
    expect(global.fetch).toHaveBeenCalledWith(
      'http://europe-1.dp.here/v1/somepath',
      expect.objectContaining({
        headers: { Authorization: 'Bearer 12345', 'content-type': 'application/json', 'x-ndb-client': 'web' },
        method: 'GET',
      }),
    );
    expect(res.id).toEqual('abc');
  });

  it('should POST', async () => {
    mockFetch({});
    await firstValueFrom(
      rest.post<{ id: string; title: string }>('/somepath', {
        id: 'abc',
        title: 'Gödel, Escher, Bach: an Eternal Golden Braid',
      }),
    );
    expect(global.fetch).toHaveBeenCalledWith(
      'http://europe-1.dp.here/v1/somepath',
      expect.objectContaining({
        body: '{"id":"abc","title":"Gödel, Escher, Bach: an Eternal Golden Braid"}',
        headers: { Authorization: 'Bearer 12345', 'content-type': 'application/json', 'x-ndb-client': 'web' },
        method: 'POST',
      }),
    );
  });

  it('should PUT', async () => {
    mockFetch({});
    await firstValueFrom(
      rest.put<{ id: string; title: string }>('/somepath', {
        id: 'abc',
        title: 'Gödel, Escher, Bach: an Eternal Golden Braid',
      }),
    );
    expect(global.fetch).toHaveBeenCalledWith(
      'http://europe-1.dp.here/v1/somepath',
      expect.objectContaining({
        body: '{"id":"abc","title":"Gödel, Escher, Bach: an Eternal Golden Braid"}',
        headers: { Authorization: 'Bearer 12345', 'content-type': 'application/json', 'x-ndb-client': 'web' },
        method: 'PUT',
      }),
    );
  });

  it('should PATCH', async () => {
    mockFetch({});
    await firstValueFrom(
      rest.patch<{ id: string; title: string }>('/somepath', {
        id: 'abc',
        title: 'Gödel, Escher, Bach: an Eternal Golden Braid',
      }),
    );
    expect(global.fetch).toHaveBeenCalledWith(
      'http://europe-1.dp.here/v1/somepath',
      expect.objectContaining({
        body: '{"id":"abc","title":"Gödel, Escher, Bach: an Eternal Golden Braid"}',
        headers: { Authorization: 'Bearer 12345', 'content-type': 'application/json', 'x-ndb-client': 'web' },
        method: 'PATCH',
      }),
    );
  });

  it('should DELETE', async () => {
    mockFetch('');
    await firstValueFrom(rest.delete<{ id: string; title: string }>('/somepath'));
    expect(global.fetch).toHaveBeenCalledWith(
      'http://europe-1.dp.here/v1/somepath',
      expect.objectContaining({
        headers: { Authorization: 'Bearer 12345', 'content-type': 'application/json', 'x-ndb-client': 'web' },
        method: 'DELETE',
      }),
    );
  });

  it('should not prefix domain with zone for global endpoints', async () => {
    mockFetch({});
    await firstValueFrom(rest.get('/account'));
    expect(global.fetch).toHaveBeenCalledWith('http://accounts.here/v1/account', expect.anything());
  });

  it('should normalize rag backend to accounts for global endpoints', async () => {
    const nuclia = new Nuclia({
      backend: 'http://rag.here',
      zone: 'europe-1',
      account: 'dc',
      knowledgeBox: 'gotham',
    });
    nuclia.auth.getAuthHeaders = () => ({ Authorization: 'Bearer 12345' });
    const ragRest = nuclia.rest as Rest;
    mockFetch({});
    await firstValueFrom(ragRest.get('/account'));
    expect(global.fetch).toHaveBeenCalledWith('http://accounts.here/v1/account', expect.anything());
  });

  it('should normalize rag backend to region.dp for regional endpoints', async () => {
    const nuclia = new Nuclia({
      backend: 'http://rag.here',
      zone: 'europe-1',
      account: 'dc',
      knowledgeBox: 'gotham',
    });
    nuclia.auth.getAuthHeaders = () => ({ Authorization: 'Bearer 12345' });
    const ragRest = nuclia.rest as Rest;
    mockFetch({});
    await firstValueFrom(ragRest.get('/somepath'));
    expect(global.fetch).toHaveBeenCalledWith('http://europe-1.dp.here/v1/somepath', expect.anything());
  });

  it('should get readable stream', async () => {
    mockReadableStream(['abc', 'def'], { index: 0 });
    const res = await firstValueFrom(
      rest.getStreamedResponse('/somepath', {}).pipe(filter((response) => !response.incomplete)),
    );
    const encoder = new TextEncoder();
    const expected = new Uint8Array(encoder.encode('abcdef'));
    expect(res.data).toEqual(expected);
  });
});
