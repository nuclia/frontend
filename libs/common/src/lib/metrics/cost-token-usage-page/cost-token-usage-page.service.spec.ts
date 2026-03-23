import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MockProvider } from 'ng-mocks';
import { SDKService, UserService } from '@flaps/core';
import { SisToastService } from '@nuclia/sistema';
import { TranslateService } from '@ngx-translate/core';
import { CostTokenUsagePageService } from './cost-token-usage-page.service';

describe('CostTokenUsagePageService', () => {
  let service: CostTokenUsagePageService;
  let queryActivityLogs: jest.Mock;

  beforeEach(() => {
    queryActivityLogs = jest.fn().mockReturnValue(of([]));
    const mockKb = {
      activityMonitor: {
        queryActivityLogs,
        getMonthsWithActivity: jest.fn().mockReturnValue(of({ downloads: [] })),
      },
    };

    TestBed.configureTestingModule({
      providers: [
        CostTokenUsagePageService,
        MockProvider(SDKService, {
          currentKb: of(mockKb as any),
          currentAccount: of({ id: 'acc-1' } as any),
          nuclia: { db: { getUsage: jest.fn().mockReturnValue(of([])) } } as any,
        }),
        MockProvider(UserService),
        MockProvider(SisToastService),
        MockProvider(TranslateService, { instant: (key: string) => key }),
      ],
    });
    service = TestBed.inject(CostTokenUsagePageService);
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
    expect(queryActivityLogs).not.toHaveBeenCalled();
  });
});
