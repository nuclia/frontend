import { TestBed } from '@angular/core/testing';
import { SDKService } from '@flaps/core';
import { TranslateService } from '@ngx-translate/core';
import { MockProvider } from 'ng-mocks';
import { firstValueFrom, of } from 'rxjs';
import { RemiMetricsService } from './remi-metrics.service';

describe('RemiMetricsService', () => {
  let service: RemiMetricsService;

  beforeEach(() => {
    const mockKb = {
      activityMonitor: {
        getRemiScores: vi.fn().mockReturnValue(of([])),
        queryRemiScores: vi.fn().mockReturnValue(of({ data: [], has_more: false })),
        getFullContexts: vi.fn().mockReturnValue(of({})),
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

  it('defaults the period to 7d', async () => {
    expect(await firstValueFrom(service.period)).toBe('7d');
  });

  it('updatePeriod changes the period', async () => {
    service.updatePeriod('24h');
    expect(await firstValueFrom(service.period)).toBe('24h');
  });
});
