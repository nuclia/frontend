import { TestBed } from '@angular/core/testing';
import { SDKService } from '@flaps/core';
import { MockProvider } from 'ng-mocks';
import { firstValueFrom, of } from 'rxjs';
import { ZoneSummary } from './zone.models';
import { ZoneService } from './zone.service';

const zones = [
  { id: 'za', slug: 'zone-a' },
  { id: 'zb', slug: 'zone-b' },
] as ZoneSummary[];

describe('ZoneService', () => {
  let service: ZoneService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MockProvider(SDKService, {
          nuclia: { rest: { get: () => of(zones), getAccountZones: () => of({ za: {}, unknown: {} }) } },
        } as unknown as SDKService),
      ],
    });
    service = TestBed.inject(ZoneService);
  });

  it('should index the loaded zones by id', async () => {
    expect(Object.keys(await firstValueFrom(service.getZoneDict()))).toEqual(['za', 'zb']);
  });

  it('should only keep the account zones that are known', async () => {
    expect(await firstValueFrom(service.getAccountZonesDict('acc'))).toEqual({ za: zones[0] });
  });
});
