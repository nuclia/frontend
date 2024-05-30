import { Nuclia } from '../../core';
import { mockReadableStream } from '../../test.utils.spec';
import { ask } from './ask';

describe('Ask', () => {
  let nuclia: Nuclia;
  beforeEach(() => {
    nuclia = new Nuclia({ backend: 'http://here', zone: 'europe-1', account: 'dc', knowledgeBox: 'gotham' });
    nuclia.auth.getAuthHeaders = () => ({ Authorization: 'Bearer 12345' });
  });

  it('should get answer from a readable stream', (done) => {
    mockReadableStream([JSON.stringify({ item: { type: 'answer', text: 'Bruce Wayne' } })], { index: 0 });
    ask(nuclia, 'gotham', '/v1/kb/gotham', 'Who is Batman?').subscribe((res) => {
      if (res.type === 'answer' && !res.incomplete) {
        expect(res.text).toEqual('Bruce Wayne');
        done();
      }
    });
  });

  it('should get citations', (done) => {
    mockReadableStream(
      [
        JSON.stringify({ item: { type: 'citations', citations: { abc123: [[0, 23]] } } }) + `\n`,
        JSON.stringify({ item: { type: 'answer', text: 'Bruce Wayne' } }) + `\n`,
      ],
      { index: 0 },
    );
    ask(nuclia, 'gotham', '/v1/kb/gotham', 'Who is Batman?').subscribe((res) => {
      if (res.type === 'answer' && !res.incomplete) {
        expect(res.citations?.abc123).toEqual([[0, 23]]);
        done();
      }
    });
  });

  it('should get sources and preserve the search id', (done) => {
    mockReadableStream(
      [
        JSON.stringify({
          item: { type: 'retrieval', results: { type: 'findResults', resources: { abc: { id: 'abc' } } } },
        }) + `\n`,
        JSON.stringify({ item: { type: 'answer', text: 'Bruce Wayne' } }) + `\n`,
      ],
      { index: 0 },
    );
    ask(nuclia, 'gotham', '/v1/kb/gotham', 'Who is Batman?').subscribe((res) => {
      if (res.type === 'answer' && !res.incomplete) {
        expect(res.sources?.resources?.abc.id).toEqual('abc');
        expect(res.sources?.searchId).toEqual('my-search-id');
        done();
      }
    });
  });

  it('should accept incomplete JSON rows', (done) => {
    mockReadableStream(['{ "item": { "type": "answer", "tex', 't": "Bruce Wayne" } }\n'], { index: 0 });
    ask(nuclia, 'gotham', '/v1/kb/gotham', 'Who is Batman?').subscribe((res) => {
      if (res.type === 'answer' && !res.incomplete) {
        expect(res.text).toEqual('Bruce Wayne');
        done();
      }
    });
  });
});
