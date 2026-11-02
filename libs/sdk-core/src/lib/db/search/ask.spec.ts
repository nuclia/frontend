import { filter, firstValueFrom, Observable } from 'rxjs';
import { Nuclia } from '../../core';
import type { IErrorResponse } from '../../models';
import { mockReadableStream } from '../../test.utils.spec';
import { ask } from './ask';
import { Ask } from './ask.models';

const firstCompleteAnswer = (answers: Observable<Ask.Answer | IErrorResponse>) =>
  firstValueFrom(
    answers.pipe(filter((res): res is Ask.Answer => res.type === 'answer' && !(res as Ask.Answer).incomplete)),
  );

describe('Ask', () => {
  let nuclia: Nuclia;
  beforeEach(() => {
    nuclia = new Nuclia({ backend: 'http://accounts.here', zone: 'europe-1', account: 'dc', knowledgeBox: 'gotham' });
    nuclia.auth.getAuthHeaders = () => ({ Authorization: 'Bearer 12345' });
  });

  it('should get answer from a readable stream', async () => {
    mockReadableStream([JSON.stringify({ item: { type: 'answer', text: 'Bruce Wayne' } })], { index: 0 });
    const res = await firstCompleteAnswer(ask(nuclia, 'gotham', '/v1/kb/gotham', 'Who is Batman?'));
    expect(res.text).toEqual('Bruce Wayne');
  });

  it('should get citations', async () => {
    mockReadableStream(
      [
        JSON.stringify({ item: { type: 'citations', citations: { abc123: [[0, 23]] } } }) + `\n`,
        JSON.stringify({ item: { type: 'answer', text: 'Bruce Wayne' } }) + `\n`,
      ],
      { index: 0 },
    );
    const res = await firstCompleteAnswer(ask(nuclia, 'gotham', '/v1/kb/gotham', 'Who is Batman?'));
    expect(res.citations?.abc123).toEqual([[0, 23]]);
  });

  it('should get sources and preserve the search id', async () => {
    mockReadableStream(
      [
        JSON.stringify({
          item: { type: 'retrieval', results: { type: 'findResults', resources: { abc: { id: 'abc' } } } },
        }) + `\n`,
        JSON.stringify({ item: { type: 'answer', text: 'Bruce Wayne' } }) + `\n`,
      ],
      { index: 0 },
    );
    const res = await firstCompleteAnswer(ask(nuclia, 'gotham', '/v1/kb/gotham', 'Who is Batman?'));
    expect(res.sources?.resources?.abc.id).toEqual('abc');
    expect(res.sources?.searchId).toEqual('my-search-id');
  });

  it('should accept incomplete JSON rows', async () => {
    mockReadableStream(['{ "item": { "type": "answer", "tex', 't": "Bruce Wayne" } }\n'], { index: 0 });
    const res = await firstCompleteAnswer(ask(nuclia, 'gotham', '/v1/kb/gotham', 'Who is Batman?'));
    expect(res.text).toEqual('Bruce Wayne');
  });
});
