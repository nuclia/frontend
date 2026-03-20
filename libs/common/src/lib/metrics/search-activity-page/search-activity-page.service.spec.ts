import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MockProvider } from 'ng-mocks';
import { SDKService } from '@flaps/core';
import { ActivityLogItem } from '@nuclia/core';
import { SearchActivityPageService } from './search-activity-page.service';

const MOCK_ROWS: ActivityLogItem[] = [
  { retrieval_time: 100, resources_count: 3, date: '2024-01-01' } as any,
  { retrieval_time: 200, resources_count: 0, date: '2024-01-02' } as any,
  { retrieval_time: null as any, resources_count: null as any, date: '2024-01-03' } as any,
];

describe('SearchActivityPageService', () => {
  let service: SearchActivityPageService;
  let queryActivityLogs: jest.Mock;
  let getMonthsWithActivity: jest.Mock;

  beforeEach(() => {
    queryActivityLogs = jest.fn();
    getMonthsWithActivity = jest.fn().mockReturnValue(of({ downloads: [] }));
    const mockKb = { activityMonitor: { queryActivityLogs, getMonthsWithActivity } };

    TestBed.configureTestingModule({
      providers: [
        SearchActivityPageService,
        MockProvider(SDKService, { currentKb: of(mockKb as any) }),
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

    it('sets totalQueries to the number of returned rows', () => {
      service.loadData('2024-01');
      expect(service.stats().totalQueries).toBe(3);
    });

    it('computes avgRetrievalTimeMs from rows with non-null retrieval_time', () => {
      service.loadData('2024-01');
      // rows[0]=100, rows[1]=200 → (100+200)/2 = 150
      expect(service.stats().avgRetrievalTimeMs).toBe(150);
    });

    it('counts emptyResults as rows where resources_count is 0 or null', () => {
      service.loadData('2024-01');
      // rows[1].resources_count=0 and rows[2].resources_count=null → 2 empty results
      expect(service.stats().emptyResults).toBe(2);
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
      const freshKb = { activityMonitor: { queryActivityLogs, getMonthsWithActivity } };
      TestBed.configureTestingModule({
        providers: [
          SearchActivityPageService,
          MockProvider(SDKService, { currentKb: of(freshKb as any) }),
        ],
      });
      const freshService = TestBed.inject(SearchActivityPageService);

      expect(freshService.availableMonths()).toEqual(['2024-03', '2024-02', '2024-01']);
    });

    it('remains empty when getMonthsWithActivity errors', () => {
      TestBed.resetTestingModule();
      getMonthsWithActivity = jest.fn().mockReturnValue(throwError(() => new Error('network error')));
      queryActivityLogs = jest.fn().mockReturnValue(of([]));
      const freshKb = { activityMonitor: { queryActivityLogs, getMonthsWithActivity } };
      TestBed.configureTestingModule({
        providers: [
          SearchActivityPageService,
          MockProvider(SDKService, { currentKb: of(freshKb as any) }),
        ],
      });
      const freshService = TestBed.inject(SearchActivityPageService);

      expect(freshService.availableMonths()).toEqual([]);
    });
  });
});
