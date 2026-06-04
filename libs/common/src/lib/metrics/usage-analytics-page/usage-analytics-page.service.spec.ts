import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MockProvider } from 'ng-mocks';
import { SDKService, UserService } from '@flaps/core';
import { TranslateService } from '@ngx-translate/core';
import { SisToastService } from '@nuclia/sistema';
import { UsageAnalyticsPageService } from './usage-analytics-page.service';

describe('UsageAnalyticsPageService', () => {
  let service: UsageAnalyticsPageService;
  let queryRemiScores: jest.Mock;

  beforeEach(() => {
    queryRemiScores = jest.fn().mockReturnValue(of({ data: [], has_more: false }));
    const mockKb = {
      activityMonitor: {
        queryRemiScores,
        getRemiScores: jest.fn().mockReturnValue(of([])),
      },
    };
    const mockAccount = {
      creation_date: '2026-02-20T09:00:00.000000',
    };

    TestBed.configureTestingModule({
      providers: [
        UsageAnalyticsPageService,
        MockProvider(SDKService, { currentKb: of(mockKb as any), currentAccount: of(mockAccount as any) }),
        MockProvider(TranslateService, { instant: (key: string) => key }),
        MockProvider(UserService, { userPrefs: of({ email: 'test@example.com' }) }),
        MockProvider(SisToastService),
      ],
    });
    service = TestBed.inject(UsageAnalyticsPageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('starts with empty items and loading false', () => {
    expect(service.items()).toEqual([]);
    expect(service.loading()).toBe(false);
  });

  it('sets loading to false after loadData completes', () => {
    service.loadData('2024-01');
    expect(service.loading()).toBe(false);
  });

  it('does nothing when yearMonth is empty', () => {
    service.loadData('');
    expect(queryRemiScores).not.toHaveBeenCalled();
  });
});
