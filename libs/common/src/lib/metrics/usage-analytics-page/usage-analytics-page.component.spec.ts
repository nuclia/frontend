import { DatePipe } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FeaturesService, SDKService, UserService } from '@flaps/core';
import { SisModalService, SisToastService } from '@nuclia/sistema';
import { SvgIconRegistryService } from 'angular-svg-icon';
import { MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import type { Mock } from 'vitest';
import { RagAdviceModalComponent } from '../rag-advice/rag-advice.component';
import { UsageAnalyticsPageComponent } from './usage-analytics-page.component';
import { UsageAnalyticsPageService } from './usage-analytics-page.service';

describe('UsageAnalyticsPageComponent', () => {
  let component: UsageAnalyticsPageComponent;
  let fixture: ComponentFixture<UsageAnalyticsPageComponent>;
  let openModal: Mock;

  beforeEach(async () => {
    openModal = vi.fn();
    const mockKb = {
      activityMonitor: {
        queryRemiScores: vi.fn().mockReturnValue(of({ data: [], has_more: false })),
        getRemiScores: vi.fn().mockReturnValue(of([])),
      },
    };
    const mockAccount = {
      creation_date: '2026-02-20T09:00:00.000000',
    };

    await TestBed.configureTestingModule({
      imports: [UsageAnalyticsPageComponent],
      providers: [
        MockProvider(SDKService, { currentKb: of(mockKb as any), currentAccount: of(mockAccount as any) }),
        MockProvider(FeaturesService, { unstable: { automaticAdvice: of(true) } as FeaturesService['unstable'] }),
        MockProvider(SisModalService, { openModal }),
        MockProvider(UserService, { userPrefs: of({ email: 'test@example.com', type: 'USER' }) }),
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
    vi.spyOn(service, 'fetchActivityParams').mockReturnValue(
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
