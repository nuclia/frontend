import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalConfig, ModalRef } from '@guillotinaweb/pastanaga-angular';
import { SDKService } from '@flaps/core';
import { MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { SearchWidgetService } from '../../search-widget';
import { AdviceInput, RagAdviceService } from './rag-advice.service';
import { RagAdviceModalComponent } from './rag-advice.component';

function makeModalRef(data: AdviceInput): ModalRef<AdviceInput> {
  return new ModalRef({ id: 0, config: new ModalConfig({ data }) });
}

function makeEditableParams() {
  return {
    minScoreSemantic: null,
    minScoreBm25: null,
    topK: null,
    neighbouringParagraphs: false,
    fullResource: false,
    metadatas: false,
    graph: false,
    rephrase: false,
    model: '',
    systemPrompt: '',
  };
}

describe('RagAdviceModalComponent', () => {
  let component: RagAdviceModalComponent;
  let fixture: ComponentFixture<RagAdviceModalComponent>;
  let generateAdvice: jest.Mock;

  beforeEach(async () => {
    generateAdvice = jest.fn().mockReturnValue(
      of({
        diagnosis: 'diagnosis',
        suggestions: [],
        suggestedParams: {},
        rawResponse: 'raw',
      }),
    );

    await TestBed.configureTestingModule({
      imports: [RagAdviceModalComponent],
      providers: [
        {
          provide: ModalRef,
          useValue: makeModalRef({
            question: 'What happened?',
            answer: 'Initial answer',
            params: { topK: 5 },
          }),
        },
        MockProvider(RagAdviceService, { generateAdvice }),
        MockProvider(SDKService, {
          currentKb: of({
            getLearningSchema: jest.fn().mockReturnValue(of({ generative_model: { options: [] } })),
          } as any),
        }),
        MockProvider(SearchWidgetService),
      ],
    })
      .overrideComponent(RagAdviceModalComponent, {
        set: {
          template: '',
          imports: [],
          schemas: [NO_ERRORS_SCHEMA],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(RagAdviceModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('preserves systemPrompt in analyzeFurther', () => {
    component.iterations.set([
      {
        round: 1,
        paramsUsed: {
          ...makeEditableParams(),
          topK: 7,
          systemPrompt: 'Answer only from context',
        },
        answer: 'Follow-up answer',
        remiScore: null,
        remiAnswerRelevance: null,
        remiContentRelevance: null,
        remiGroundedness: null,
        noContext: false,
        remiPending: false,
      } as any,
    ]);
    fixture.detectChanges();

    component.analyzeFurther();
    fixture.detectChanges();

    expect(generateAdvice).toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({
          topK: 7,
          systemPrompt: 'Answer only from context',
        }),
      }),
    );
  });

  it('normalizes editable numeric params', () => {
    component.editableParams.set(makeEditableParams());

    component.updateMinScoreSemantic(2);
    fixture.detectChanges();
    expect(component.editableParams()?.minScoreSemantic).toBe(1);

    component.updateMinScoreBm25(-1);
    fixture.detectChanges();
    expect(component.editableParams()?.minScoreBm25).toBe(0);

    component.updateTopK(0);
    fixture.detectChanges();
    expect(component.editableParams()?.topK).toBeNull();

    component.updateTopK(3.9);
    fixture.detectChanges();
    expect(component.editableParams()?.topK).toBe(3);
  });
});
