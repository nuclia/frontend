import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MockProvider } from 'ng-mocks';
import { SDKService, UserService } from '@flaps/core';
import { SisToastService } from '@nuclia/sistema';
import { TranslateService } from '@ngx-translate/core';
import { ActivityLogItem } from '@nuclia/core';
import { SearchActivityPageService } from './search-activity-page.service';

const MOCK_ROWS: ActivityLogItem[] = [
  { retrieval_time: 100, resources_count: 3, date: '2024-01-01', id: 1 } as any,
  { retrieval_time: 200, resources_count: 0, date: '2024-01-02', id: 2 } as any,
  { retrieval_time: null as any, resources_count: null as any, date: '2024-01-03', id: 3 } as any,
];

describe('SearchActivityPageService', () => {
  let service: SearchActivityPageService;
  let queryActivityLogs: jest.Mock;
  let getMonthsWithActivity: jest.Mock;

  beforeEach(() => {
    queryActivityLogs = jest.fn();
    getMonthsWithActivity = jest.fn().mockReturnValue(of({ downloads: [] }));
    const mockKb = {
      activityMonitor: {
        queryActivityLogs,
        getMonthsWithActivity,
        getSearchMetrics: jest.fn().mockReturnValue(of([])),
      },
    };

    TestBed.configureTestingModule({
      providers: [
        SearchActivityPageService,
        MockProvider(SDKService, { currentKb: of(mockKb as any) }),
        MockProvider(UserService),
        MockProvider(SisToastService),
        MockProvider(TranslateService, { instant: (key: string) => key }),
      ],
    });
    service = TestBed.inject(SearchActivityPageService);
  });

  describe('loadData() — success path', () => {
    beforeEach(() => {
      queryActivityLogs.mockReturnValue(of(MOCK_ROWS));
    });

    it('sets items from the API response', () => {
      service.loadData('2024-01');
      expect(service.items()).toEqual(MOCK_ROWS);
    });

    it('sets loading to false after a successful response', () => {
      service.loadData('2024-01');
      expect(service.loading()).toBe(false);
    });
  });

  describe('loadData() — error path', () => {
    beforeEach(() => {
      queryActivityLogs.mockReturnValue(throwError(() => new Error('API error')));
    });

    it('sets items to an empty array on error', () => {
      service.loadData('2024-01');
      expect(service.items()).toEqual([]);
    });

    it('sets loading to false on error', () => {
      service.loadData('2024-01');
      expect(service.loading()).toBe(false);
    });
  });

  it('does nothing when yearMonth is empty', () => {
    service.loadData('');
    expect(queryActivityLogs).not.toHaveBeenCalled();
    expect(service.loading()).toBe(false);
  });

  describe('availableMonths signal', () => {
    it('starts as an empty array', () => {
      expect(service.availableMonths()).toEqual([]);
    });

    it('is populated with months from getMonthsWithActivity, sorted descending', () => {
      TestBed.resetTestingModule();
      const months = ['2024-01', '2024-03', '2024-02'];
      getMonthsWithActivity = jest.fn().mockReturnValue(of({ downloads: months }));
      queryActivityLogs = jest.fn().mockReturnValue(of([]));
      const freshKb = {
        activityMonitor: {
          queryActivityLogs,
          getMonthsWithActivity,
          getSearchMetrics: jest.fn().mockReturnValue(of([])),
        },
      };
      TestBed.configureTestingModule({
        providers: [
          SearchActivityPageService,
          MockProvider(SDKService, { currentKb: of(freshKb as any) }),
          MockProvider(UserService),
          MockProvider(SisToastService),
          MockProvider(TranslateService, { instant: (key: string) => key }),
        ],
      });
      const freshService = TestBed.inject(SearchActivityPageService);

      expect(freshService.availableMonths()).toEqual(['2024-03', '2024-02', '2024-01']);
    });

    it('remains empty when getMonthsWithActivity errors', () => {
      TestBed.resetTestingModule();
      getMonthsWithActivity = jest.fn().mockReturnValue(throwError(() => new Error('network error')));
      queryActivityLogs = jest.fn().mockReturnValue(of([]));
      const freshKb = {
        activityMonitor: {
          queryActivityLogs,
          getMonthsWithActivity,
          getSearchMetrics: jest.fn().mockReturnValue(of([])),
        },
      };
      TestBed.configureTestingModule({
        providers: [
          SearchActivityPageService,
          MockProvider(SDKService, { currentKb: of(freshKb as any) }),
          MockProvider(UserService),
          MockProvider(SisToastService),
          MockProvider(TranslateService, { instant: (key: string) => key }),
        ],
      });
      const freshService = TestBed.inject(SearchActivityPageService);

      expect(freshService.availableMonths()).toEqual([]);
    });
  });
});
