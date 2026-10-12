import { DatePipe } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FeaturesService, SDKService, UserService } from '@flaps/core';
import { TranslateModule } from '@ngx-translate/core';
import { SisModalService, SisToastService } from '@nuclia/sistema';
import { SvgIconRegistryService } from 'angular-svg-icon';
import { MockPipe, MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { CompactNumberPipe } from '../../pipes/compact-number.pipe';
import { RagAdviceModalComponent } from '../rag-advice/rag-advice.component';
import { UsageAnalyticsPageComponent } from './usage-analytics-page.component';
import { UsageAnalyticsPageService } from './usage-analytics-page.service';

describe('UsageAnalyticsPageComponent', () => {
  let component: UsageAnalyticsPageComponent;
  let fixture: ComponentFixture<UsageAnalyticsPageComponent>;
  let openModal: jest.Mock;

  beforeEach(async () => {
    openModal = jest.fn();
    const mockKb = {
      activityMonitor: {
        queryRemiScores: jest.fn().mockReturnValue(of({ data: [], has_more: false })),
        getRemiScores: jest.fn().mockReturnValue(of([])),
      },
    };
    const mockAccount = {
      creation_date: '2026-02-20T09:00:00.000000',
    };

    await TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot(), UsageAnalyticsPageComponent, MockPipe(CompactNumberPipe)],
      providers: [
        MockProvider(SDKService, { currentKb: of(mockKb as any), currentAccount: of(mockAccount as any) }),
        MockProvider(FeaturesService, { unstable: { automaticAdvice: of(true) } }),
        MockProvider(SisModalService, { openModal }),
        MockProvider(UserService, { userPrefs: of({ email: 'test@example.com' }) }),
        MockProvider(SisToastService),
        DatePipe,
        {
          provide: SvgIconRegistryService,
          useValue: {
            loadSvg: () => {
              /* empty */
            },
          },
        },
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
