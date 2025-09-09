import { Nuclia } from '../core';
import { IAuthentication, INuclia } from '../models';
import { mockFetch } from '../test.utils.spec';
import { Db } from './db';

describe('Db', () => {
  let db: Db;

  beforeEach(() => {
    const nuclia = new Nuclia({
      backend: 'http://here',
      zone: 'europe-1',
      account: 'dc',
      knowledgeBox: 'gotham',
      accountId: 'dc-id',
    });
    db = new Db({
      ...nuclia,
      auth: {
        getAuthHeaders: () => ({ Authorization: 'Bearer 12345' }),
      } as unknown as IAuthentication,
    } as unknown as INuclia);
  });

  it('should get accounts', (done) => {
    mockFetch([{ id: '123456789', slug: 'gotham', title: 'Gotham City', zone: 'DC', type: 'stash-basic' }]);
    db.getAccounts().subscribe((res) => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://here/v1/accounts',
        expect.objectContaining({
          method: 'GET',
        }),
      );
      expect(res[0].slug).toEqual('gotham');
      done();
    });
  });

  it('should get knowledge boxes', (done) => {
    mockFetch([
      {
        id: 'qwerty',
        slug: 'geb',
        zone: '1',
        title: 'Gödel, Escher, Bach: an Eternal Golden Braid',
        state: 'PRIVATE',
        description: null,
      },
    ]);
    db.getKnowledgeBoxes('my-account', 'dc-id').subscribe((res) => {
      expect(global.fetch).toHaveBeenCalledTimes(3);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://here/v1/zones',
        expect.objectContaining({
          method: 'GET',
        }),
      );
      expect(global.fetch).toHaveBeenCalledWith(
        'http://here/v1/account/my-account/index/kbs',
        expect.objectContaining({
          method: 'GET',
        }),
      );
      expect(global.fetch).toHaveBeenCalledWith(
        'http://here/v1/account/dc-id/kbs',
        expect.objectContaining({
          method: 'GET',
        }),
      );
      expect(res[0].slug).toEqual('geb');
      done();
    });
  });

  it('should get retrieval agents', (done) => {
    mockFetch([
      {
        id: 'qwerty',
        slug: 'geb',
        zone: '1',
        title: 'Gödel, Escher, Bach: an Eternal Golden Braid',
        state: 'PRIVATE',
        description: null,
      },
    ]);
    db.getRetrievalAgents('my-account', 'dc-id').subscribe((res) => {
      expect(global.fetch).toHaveBeenCalledTimes(3);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://here/v1/zones',
        expect.objectContaining({
          method: 'GET',
        }),
      );
      expect(global.fetch).toHaveBeenCalledWith(
        'http://here/v1/account/my-account/index/kbs',
        expect.objectContaining({
          method: 'GET',
        }),
      );
      expect(global.fetch).toHaveBeenCalledWith(
        'http://here/v1/account/dc-id/kbs?mode=agent',
        expect.objectContaining({
          method: 'GET',
        }),
      );
      expect(res[0].slug).toEqual('geb');
      done();
    });
  });

  it('should get a knowledge box', (done) => {
    mockFetch({
      id: 'qwerty',
      slug: 'geb',
      zone: '1',
      title: 'Gödel, Escher, Bach: an Eternal Golden Braid',
      state: 'PRIVATE',
      description: null,
    });
    db.getKnowledgeBox().subscribe((res) => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://here/v1/account/dc-id/kb/gotham',
        expect.objectContaining({
          method: 'GET',
        }),
      );
      expect(res.slug).toEqual('geb');
      done();
    });
  });

  it('should get a retrieval agent', (done) => {
    mockFetch({
      id: 'qwerty',
      slug: 'geb',
      zone: '1',
      title: 'Gödel, Escher, Bach: an Eternal Golden Braid',
      state: 'PRIVATE',
      description: null,
    });
    db.getRetrievalAgent().subscribe((res) => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://here/v1/account/dc-id/kb/gotham',
        expect.objectContaining({
          method: 'GET',
        }),
      );
      expect(res.slug).toEqual('geb');
      done();
    });
  });
});
