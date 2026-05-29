import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MockProvider } from 'ng-mocks';
import { SDKService, UserService } from '@flaps/core';
import { SisToastService } from '@nuclia/sistema';
import { TranslateService } from '@ngx-translate/core';
import { ActivityLogItem } from '@nuclia/core';
import { SearchActivityPageService } from './search-activity-page.service';
import { MetricsService } from '../../account';

const MOCK_ROWS: ActivityLogItem[] = [
  { retrieval_time: 100, resources_count: 3, date: '2024-01-01', id: 1 } as any,
  { retrieval_time: 200, resources_count: 0, date: '2024-01-02', id: 2 } as any,
  { retrieval_time: null as any, resources_count: null as any, date: '2024-01-03', id: 3 } as any,
];

describe('SearchActivityPageService', () => {
  let service: SearchActivityPageService;
  let queryActivityLogs: jest.Mock;

  beforeEach(() => {
    queryActivityLogs = jest.fn();
    const mockKb = {
      activityMonitor: {
        queryActivityLogs,
        getSearchMetrics: jest.fn().mockReturnValue(of([])),
      },
    };
    const mockAccount = {
      creation_date: '2026-02-20T09:19:05.819155',
    };

    TestBed.configureTestingModule({
      providers: [
        SearchActivityPageService,
        MockProvider(SDKService, { currentKb: of(mockKb as any), currentAccount: of(mockAccount as any) }),
        MockProvider(MetricsService),
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
    beforeAll(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-04-15T12:00:00Z'));
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it('is populated with months from since account creation, sorted descending', () => {
      TestBed.resetTestingModule();
      expect(service.availableMonths()).toEqual(['2026-04', '2026-03', '2026-02']);
    });
  });
});
