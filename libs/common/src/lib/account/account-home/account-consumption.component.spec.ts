import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FeaturesService, NavigationService, SDKService, Zone, ZoneService } from '@flaps/core';
import { IKnowledgeBoxItem, NUAClient, UsagePoint } from '@nuclia/core';
import { MockProvider } from 'ng-mocks';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { MetricsService } from '../metrics.service';
import { AccountConsumptionComponent } from './account-consumption.component';

const mockKb = (id: string): IKnowledgeBoxItem =>
  ({ id, slug: id, title: id, zone: 'zone', state: 'PRIVATE' }) as IKnowledgeBoxItem;
const mockNuaKey = (id: string): NUAClient =>
  ({
    client_id: id,
    internal_id: id,
    title: id,
    zone: 'zone',
    contact: 'a@b.com',
    created: '',
    partitions: 0,
  }) as NUAClient;
const mockZone = (slug: string): Zone => ({ id: slug, slug, cloud_provider: 'AWS', private: false, origin: null });
const mockUsage = (): UsagePoint[] => [{ metrics: [] } as unknown as UsagePoint];

describe('AccountConsumptionComponent', () => {
  let fixture: ComponentFixture<AccountConsumptionComponent>;
  let component: AccountConsumptionComponent;
  let currentAccount$: BehaviorSubject<{ id: string; slug: string }>;
  let zonesForAccount: { [accountId: string]: Zone[] };
  let getKnowledgeBoxesForZone: jest.Mock;
  let getNUAClientsForZone: jest.Mock;
  let getUsage: jest.Mock;

  beforeEach(async () => {
    currentAccount$ = new BehaviorSubject({ id: 'acc-1', slug: 'acc-1-slug' });
    zonesForAccount = {};
    getKnowledgeBoxesForZone = jest.fn().mockReturnValue(of([] as IKnowledgeBoxItem[]));
    getNUAClientsForZone = jest.fn().mockReturnValue(of([] as NUAClient[]));
    getUsage = jest.fn().mockReturnValue(of(mockUsage()));

    await TestBed.configureTestingModule({
      declarations: [AccountConsumptionComponent],
      providers: [
        MockProvider(MetricsService, {
          account$: currentAccount$ as any,
          period: of({ start: new Date('2024-01-01'), end: new Date('2024-01-31') }),
          getUsageCount: jest.fn().mockReturnValue(of({ year: 0, month: 0, sinceCreation: 0 })),
          getTokensCountByKey: jest.fn().mockReturnValue({}),
        }),
        MockProvider(SDKService, {
          currentAccount: currentAccount$ as any,
          nuclia: {
            db: { getKnowledgeBoxesForZone, getNUAClientsForZone, getUsage },
            options: {},
          } as any,
        }),
        MockProvider(NavigationService),
        MockProvider(FeaturesService, { unstable: { viewNuaActivity: of(false) } as any }),
        MockProvider(ZoneService, {
          // Reads the zone list for whichever account is currently active, so switching accounts changes the zones returned.
          getZones: jest.fn(() => of(zonesForAccount[currentAccount$.value.id] || [])),
        }),
      ],
    })
      .overrideComponent(AccountConsumptionComponent, { set: { template: '<div></div>' } })
      .compileComponents();

    fixture = TestBed.createComponent(AccountConsumptionComponent);
    component = fixture.componentInstance;
  });

  describe('kbs', () => {
    it('grows incrementally as each zone resolves instead of waiting for all zones', () => {
      zonesForAccount['acc-1'] = [mockZone('zone-a'), mockZone('zone-b')];
      const zoneA$ = new Subject<IKnowledgeBoxItem[]>();
      const zoneB$ = new Subject<IKnowledgeBoxItem[]>();
      getKnowledgeBoxesForZone.mockImplementation((_accountId: string, zoneSlug: string) =>
        zoneSlug === 'zone-a' ? zoneA$ : zoneB$,
      );

      const emissions: IKnowledgeBoxItem[][] = [];
      component.kbs.subscribe((kbs) => emissions.push(kbs));

      expect(emissions).toEqual([]);

      zoneA$.next([mockKb('kb-a')]);
      expect(emissions[emissions.length - 1]).toEqual([mockKb('kb-a')]);

      zoneB$.next([mockKb('kb-b')]);
      expect(emissions[emissions.length - 1]).toEqual([mockKb('kb-a'), mockKb('kb-b')]);
    });

    it('resets the accumulated list when the account changes instead of concatenating across accounts', () => {
      zonesForAccount['acc-1'] = [mockZone('zone-a')];
      zonesForAccount['acc-2'] = [mockZone('zone-c')];
      getKnowledgeBoxesForZone.mockImplementation((_accountId: string, zoneSlug: string) =>
        of(zoneSlug === 'zone-a' ? [mockKb('kb-a')] : [mockKb('kb-c')]),
      );

      const emissions: IKnowledgeBoxItem[][] = [];
      component.kbs.subscribe((kbs) => emissions.push(kbs));

      expect(emissions[emissions.length - 1]).toEqual([mockKb('kb-a')]);

      currentAccount$.next({ id: 'acc-2', slug: 'acc-2-slug' });

      expect(emissions[emissions.length - 1]).toEqual([mockKb('kb-c')]);
    });

    it('skips a zone that fails to load instead of failing the whole list', () => {
      zonesForAccount['acc-1'] = [mockZone('zone-a'), mockZone('zone-b')];
      // Simulates the real SDK behaviour: a failing zone request falls back to an empty array (see Db.getKnowledgeBoxesForZone).
      getKnowledgeBoxesForZone.mockImplementation((_accountId: string, zoneSlug: string) =>
        zoneSlug === 'zone-a' ? of([mockKb('kb-a')]) : of([] as IKnowledgeBoxItem[]),
      );

      const emissions: IKnowledgeBoxItem[][] = [];
      component.kbs.subscribe((kbs) => emissions.push(kbs));

      expect(emissions[emissions.length - 1]).toEqual([mockKb('kb-a')]);
    });
  });

  describe('nuaKeys', () => {
    it('grows incrementally as each zone resolves', () => {
      zonesForAccount['acc-1'] = [mockZone('zone-a'), mockZone('zone-b')];
      const zoneA$ = new Subject<NUAClient[]>();
      const zoneB$ = new Subject<NUAClient[]>();
      getNUAClientsForZone.mockImplementation((_accountId: string, zoneSlug: string) =>
        zoneSlug === 'zone-a' ? zoneA$ : zoneB$,
      );

      const emissions: NUAClient[][] = [];
      component.nuaKeys.subscribe((nuaKeys) => emissions.push(nuaKeys));

      zoneA$.next([mockNuaKey('nua-a')]);
      expect(emissions[emissions.length - 1]).toEqual([mockNuaKey('nua-a')]);

      zoneB$.next([mockNuaKey('nua-b')]);
      expect(emissions[emissions.length - 1]).toEqual([mockNuaKey('nua-a'), mockNuaKey('nua-b')]);
    });
  });

  describe('usage map (via ngOnInit)', () => {
    it('fetches usage incrementally per kb/nua-key/account without refetching already-seen items', fakeAsync(() => {
      zonesForAccount['acc-1'] = [mockZone('zone-a')];
      const kbs$ = new Subject<IKnowledgeBoxItem[]>();
      getKnowledgeBoxesForZone.mockReturnValue(kbs$);
      getNUAClientsForZone.mockReturnValue(of([] as NUAClient[]));

      component.ngOnInit();
      tick();

      // Account-level usage is fetched immediately, kb usage waits for the kb list.
      expect(getUsage).toHaveBeenCalledWith(
        'acc-1',
        expect.any(String),
        expect.any(String),
        undefined,
        undefined,
        undefined,
      );
      expect(component.usage?.['account']).toBeDefined();
      expect(getUsage).not.toHaveBeenCalledWith(
        'acc-1',
        expect.any(String),
        expect.any(String),
        'kb-a',
        undefined,
        undefined,
      );

      kbs$.next([mockKb('kb-a')]);
      tick();

      expect(getUsage).toHaveBeenCalledWith(
        'acc-1',
        expect.any(String),
        expect.any(String),
        'kb-a',
        undefined,
        undefined,
      );
      expect(component.usage?.['kb-a']).toBeDefined();

      const callCountAfterFirstKb = getUsage.mock.calls.length;

      // A second zone resolves adding a new kb; only the *new* kb should trigger a usage fetch.
      kbs$.next([mockKb('kb-a'), mockKb('kb-b')]);
      tick();

      expect(getUsage).toHaveBeenCalledWith(
        'acc-1',
        expect.any(String),
        expect.any(String),
        'kb-b',
        undefined,
        undefined,
      );
      expect(getUsage.mock.calls.length).toBe(callCountAfterFirstKb + 1);
    }));

    it('fetches usage for new nua keys as they resolve', fakeAsync(() => {
      zonesForAccount['acc-1'] = [mockZone('zone-a')];
      getKnowledgeBoxesForZone.mockReturnValue(of([] as IKnowledgeBoxItem[]));
      const nuaKeys$ = new Subject<NUAClient[]>();
      getNUAClientsForZone.mockReturnValue(nuaKeys$);

      component.ngOnInit();
      tick();

      nuaKeys$.next([mockNuaKey('nua-a')]);
      tick();

      expect(getUsage).toHaveBeenCalledWith(
        'acc-1',
        expect.any(String),
        expect.any(String),
        undefined,
        undefined,
        'nua-a',
      );
      expect(component.usage?.['nua-a']).toBeDefined();
    }));
  });
});
