import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MockModule, MockPipe, MockProvider } from 'ng-mocks';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { SDKService, FeaturesService } from '@flaps/core';
import { SisModalService } from '@nuclia/sistema';
import { UsageAnalyticsPageComponent } from './usage-analytics-page.component';
import { UsageAnalyticsPageService } from './usage-analytics-page.service';
import { CompactNumberPipe } from '../../pipes/compact-number.pipe';
import { RagAdviceModalComponent } from '../rag-advice/rag-advice.component';

describe('UsageAnalyticsPageComponent', () => {
  let component: UsageAnalyticsPageComponent;
  let fixture: ComponentFixture<UsageAnalyticsPageComponent>;
  let openModal: jest.Mock;

  beforeEach(async () => {
    openModal = jest.fn();
    const mockKb = {
      activityMonitor: {
        queryRemiScores: jest.fn().mockReturnValue(of({ data: [], has_more: false })),
        getMonthsWithActivity: jest.fn().mockReturnValue(of({ downloads: [] })),
        getRemiScores: jest.fn().mockReturnValue(of([])),
      },
    };

    await TestBed.configureTestingModule({
      declarations: [UsageAnalyticsPageComponent, MockPipe(CompactNumberPipe)],
      imports: [MockModule(TranslateModule)],
      providers: [
        MockProvider(SDKService, { currentKb: of(mockKb as any) }),
        MockProvider(FeaturesService, { unstable: { automaticAdvice: of(true) } }),
        MockProvider(TranslateService, { instant: (key: string) => key }),
        MockProvider(SisModalService, { openModal }),
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(UsageAnalyticsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('passes result_per_page as topK when opening advice', () => {
    const service = fixture.debugElement.injector.get(UsageAnalyticsPageService);
    jest.spyOn(service, 'fetchActivityParams').mockReturnValue(
      of({
        id: 42,
        question: 'How many tokens?',
        answer: '42',
        result_per_page: 12,
      } as any),
    );

    component.openAdvice({
      id: 42,
      _remiAnswerRelevance: 4.5,
      _remiContextRelevance: 3.5,
      _remiGroundedness: 4.8,
    } as any);

    expect(openModal).toHaveBeenCalledWith(RagAdviceModalComponent, expect.anything());
    expect(openModal.mock.calls[0][1].data.params.topK).toBe(12);
  });
});
