import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MockProvider } from 'ng-mocks';
import { SDKService } from '@flaps/core';
import { TranslateService } from '@ngx-translate/core';
import { RemiMetricsService } from './remi-metrics.service';

describe('RemiMetricsService', () => {
  let service: RemiMetricsService;

  beforeEach(() => {
    const mockKb = {
      activityMonitor: {
        getRemiScores: jest.fn().mockReturnValue(of([])),
        queryRemiScores: jest.fn().mockReturnValue(of({ data: [], has_more: false })),
        getFullContexts: jest.fn().mockReturnValue(of({})),
      },
    };

    TestBed.configureTestingModule({
      providers: [
        RemiMetricsService,
        MockProvider(SDKService, { currentKb: of(mockKb as any) }),
        MockProvider(TranslateService, { instant: (key: string) => key }),
      ],
    });
    service = TestBed.inject(RemiMetricsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('defaults the period to 7d', (done) => {
    service.period.subscribe((period) => {
      expect(period).toBe('7d');
      done();
    });
  });

  it('updatePeriod changes the period', (done) => {
    service.updatePeriod('24h');
    service.period.subscribe((period) => {
      expect(period).toBe('24h');
      done();
    });
  });
});
