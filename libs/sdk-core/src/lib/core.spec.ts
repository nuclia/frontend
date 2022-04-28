import { Nuclia } from './core';

describe('Nuclia', () => {
  it('should instanciate all the services', () => {
    const nuclia = new Nuclia({ backend: 'http://here', zone: 'europe-1', account: 'dc', knowledgeBox: 'gotham' });
    expect(nuclia.backend).toEqual('http://here');
    expect(nuclia.auth).toBeTruthy();
    expect(nuclia.rest).toBeTruthy();
    expect(nuclia.db).toBeTruthy();
  });
});
