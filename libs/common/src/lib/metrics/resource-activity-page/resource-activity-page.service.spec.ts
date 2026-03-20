import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MockProvider } from 'ng-mocks';
import { SDKService } from '@flaps/core';
import { ActivityLogItem } from '@nuclia/core';
import { ResourceActivityPageService } from './resource-activity-page.service';

const makeItem = (date: string): ActivityLogItem => ({ date } as any);

describe('ResourceActivityPageService', () => {
  let service: ResourceActivityPageService;
  let queryActivityLogs: jest.Mock;
  let getMonthsWithActivity: jest.Mock;

  beforeEach(() => {
    queryActivityLogs = jest.fn();
    getMonthsWithActivity = jest.fn().mockReturnValue(of({ downloads: [] }));
    const mockKb = { activityMonitor: { queryActivityLogs, getMonthsWithActivity } };

    TestBed.configureTestingModule({
      providers: [
        ResourceActivityPageService,
        MockProvider(SDKService, { currentKb: of(mockKb as any) }),
      ],
    });
    service = TestBed.inject(ResourceActivityPageService);
  });

  describe('filterByStatus()', () => {
    it('updates activeStatusFilter to the provided status', () => {
      service.filterByStatus('Ingested');
      expect(service.activeStatusFilter()).toBe('Ingested');
    });

    it('can be updated to a different status', () => {
      service.filterByStatus('Ingested');
      service.filterByStatus('Processed');
      expect(service.activeStatusFilter()).toBe('Processed');
    });
  });

  describe('clearStatusFilter()', () => {
    it('resets activeStatusFilter to an empty string', () => {
      service.filterByStatus('Processed');
      service.clearStatusFilter();
      expect(service.activeStatusFilter()).toBe('');
    });
  });

  describe('loadData() — success path', () => {
    it('computes stats from grouped items returned by forkJoin', () => {
      const ingestedItems = [makeItem('2024-01-01'), makeItem('2024-01-02')];
      const editedItems = [makeItem('2024-01-03')];
      const processedItems: ActivityLogItem[] = [];

      // forkJoin calls queryActivityLogs in declaration order:
      // sources[0]=NEW(Ingested), sources[1]=MODIFIED(Edited), sources[2]=PROCESSED(Processed)
      queryActivityLogs
        .mockReturnValueOnce(of(ingestedItems))
        .mockReturnValueOnce(of(editedItems))
        .mockReturnValueOnce(of(processedItems));

      service.loadData('2024-01');

      expect(service.stats().resourcesIngested).toBe(2);
      expect(service.stats().resourcesEdited).toBe(1);
      expect(service.stats().resourcesProcessed).toBe(0);
    });

    it('sets loading to false after success', () => {
      queryActivityLogs.mockReturnValue(of([]));
      service.loadData('2024-01');
      expect(service.loading()).toBe(false);
    });

    it('merges and sorts all groups by date descending', () => {
      queryActivityLogs
        .mockReturnValueOnce(of([makeItem('2024-01-01')]))
        .mockReturnValueOnce(of([makeItem('2024-01-03')]))
        .mockReturnValueOnce(of([makeItem('2024-01-02')]));

      service.loadData('2024-01');

      const dates = service.items().map((i) => i.date);
      expect(dates).toEqual(['2024-01-03', '2024-01-02', '2024-01-01']);
    });
  });

  describe('availableMonths signal', () => {
    it('starts as an empty array', () => {
      expect(service.availableMonths()).toEqual([]);
    });

    it('unions months from all three event types and deduplicates, sorted descending', () => {
      TestBed.resetTestingModule();
      const gmwa = jest.fn()
        .mockReturnValueOnce(of({ downloads: ['2024-01', '2024-02'] })) // NEW
        .mockReturnValueOnce(of({ downloads: ['2024-02', '2024-03'] })) // MODIFIED
        .mockReturnValueOnce(of({ downloads: ['2024-01', '2024-03'] })); // PROCESSED
      const qal = jest.fn().mockReturnValue(of([]));
      const freshKb = { activityMonitor: { queryActivityLogs: qal, getMonthsWithActivity: gmwa } };
      TestBed.configureTestingModule({
        providers: [
          ResourceActivityPageService,
          MockProvider(SDKService, { currentKb: of(freshKb as any) }),
        ],
      });
      const freshService = TestBed.inject(ResourceActivityPageService);

      expect(freshService.availableMonths()).toEqual(['2024-03', '2024-02', '2024-01']);
    });

    it('remains empty when getMonthsWithActivity errors', () => {
      TestBed.resetTestingModule();
      const gmwa = jest.fn().mockReturnValue(throwError(() => new Error('err')));
      const qal = jest.fn().mockReturnValue(of([]));
      const freshKb = { activityMonitor: { queryActivityLogs: qal, getMonthsWithActivity: gmwa } };
      TestBed.configureTestingModule({
        providers: [
          ResourceActivityPageService,
          MockProvider(SDKService, { currentKb: of(freshKb) }),
        ],
      });
      const freshService = TestBed.inject(ResourceActivityPageService);

      expect(freshService.availableMonths()).toEqual([]);
    });
  });
});
