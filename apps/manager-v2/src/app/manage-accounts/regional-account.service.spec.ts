import type { Mock } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { SDKService } from '@flaps/core';
import { MockProvider } from 'ng-mocks';
import { firstValueFrom, of, throwError } from 'rxjs';
import { ZoneSummary } from '../manage-zones/zone.models';
import { ZoneService } from '../manage-zones/zone.service';
import { AccountDetails, KbSummary } from './account-ui.models';
import { RegionalAccountService } from './regional-account.service';

const zoneA = { id: 'za', slug: 'zone-a' } as ZoneSummary;
const zoneB = { id: 'zb', slug: 'zone-b' } as ZoneSummary;
const kbSummary = { id: 'kb', accountId: 'acc', zone: zoneA } as KbSummary;

describe('RegionalAccountService', () => {
  let service: RegionalAccountService;
  let get: Mock;
  let getModels: Mock;
  let zoneDict: Record<string, ZoneSummary>;

  beforeEach(() => {
    zoneDict = { za: zoneA, zb: zoneB };
    get = vi.fn();
    getModels = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        MockProvider(SDKService, { nuclia: { rest: { get }, db: { getModels } } } as unknown as SDKService),
        MockProvider(ZoneService, {
          getZoneDict: () => of(zoneDict),
          getAccountZonesDict: () => of(zoneDict),
        }),
      ],
    });
    service = TestBed.inject(RegionalAccountService);
  });

  describe('getKbDetails', () => {
    const accountDetails = {
      users: [
        { id: 'u1', name: 'Alice', email: 'alice@nuclia.com' },
        { id: 'u2', name: null, email: 'bob@nuclia.com' },
      ],
    } as AccountDetails;

    it('should dispatch KB users by role and ignore users outside of the account', async () => {
      get.mockImplementation((path: string) =>
        of(
          path.endsWith('/users')
            ? [
                { id: 'u1', role: 'SOWNER' },
                { id: 'u2', role: 'SMEMBER' },
                { id: 'unknown', role: 'SCONTRIBUTOR' },
              ]
            : { slug: 'kb-slug', title: 'KB', created: 'now', state: 'PUBLISHED' },
        ),
      );
      const details = await firstValueFrom(service.getKbDetails(kbSummary, accountDetails));
      expect(details.published).toBe(true);
      expect(details.owners.map((user) => user.email)).toEqual(['alice@nuclia.com']);
      expect(details.members.map((user) => user.name)).toEqual(['']);
      expect(details.contributors).toEqual([]);
    });

    it('should fall back to the summary when the KB zone is unknown', async () => {
      zoneDict = {};
      expect(await firstValueFrom(service.getKbDetails(kbSummary, accountDetails))).toBe(kbSummary);
      expect(get).not.toHaveBeenCalled();
    });
  });

  describe('getModelsPerZone', () => {
    it('should return an empty list for a zone failing to answer', async () => {
      getModels.mockImplementation((_: string, zoneSlug: string) =>
        zoneSlug === 'zone-a' ? throwError(() => new Error('down')) : of([{ id: 'm1' }]),
      );
      expect(await firstValueFrom(service.getModelsPerZone('acc'))).toEqual([
        { zone: zoneA, models: [] },
        { zone: zoneB, models: [{ id: 'm1' }] },
      ]);
    });
  });

  describe('getProjects', () => {
    it('should flatten the projects of every zone, skipping the failing ones', async () => {
      get.mockImplementation((_: string, __: unknown, ___: unknown, zoneSlug: string) =>
        zoneSlug === 'zone-a' ? throwError(() => new Error('down')) : of({ data: [{ id: 'p1' }] }),
      );
      expect(await firstValueFrom(service.getProjects('acc'))).toEqual([{ id: 'p1', zone: zoneB }]);
    });
  });
});
