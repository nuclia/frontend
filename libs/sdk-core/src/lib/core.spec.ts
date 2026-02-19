import { Nuclia } from './core';
import { LocalStorageMock } from './test.utils.spec';

describe('Nuclia', () => {
  beforeAll(() => {
    global.localStorage = new LocalStorageMock() as unknown as Storage;
  });

  it('should instantiate all the services', () => {
    const nuclia = new Nuclia({
      backend: 'http://accounts.here',
      zone: 'europe-1',
      account: 'dc',
      knowledgeBox: 'gotham',
    });
    expect(nuclia.backend).toEqual('http://accounts.here');
    expect(nuclia.auth).toBeTruthy();
    expect(nuclia.rest).toBeTruthy();
    expect(nuclia.db).toBeTruthy();
  });
});
