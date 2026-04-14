import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { MockProvider } from 'ng-mocks';
import { firstValueFrom, of } from 'rxjs';
import { RagAdviceService } from './rag-advice.service';

describe('RagAdviceService', () => {
  let service: RagAdviceService;
  let post: jest.Mock;

  beforeEach(() => {
    post = jest.fn();

    TestBed.configureTestingModule({
      providers: [RagAdviceService, MockProvider(HttpClient, { post })],
    });

    service = TestBed.inject(RagAdviceService);
  });

  it('ignores advisor model suggestions while keeping supported params', async () => {
    post.mockReturnValue(
      of(
        '{"item":{"type":"answer","text":"DIAGNOSIS: Retrieval needs more context.\\nSUGGESTIONS:\\n1. Increase top_k.\\nPARAMS_JSON: \\u007B\\"model\\":\\"chatgpt-azure-4o\\",\\"topK\\":12\\u007D"}}',
      ),
    );

    const result = await firstValueFrom(
      service.generateAdvice({
        question: 'What is RAG?',
        answer: 'It depends.',
      }),
    );

    expect(result.suggestedParams?.topK).toBe(12);
    expect(result.suggestedParams?.model).toBeUndefined();
  });
});
