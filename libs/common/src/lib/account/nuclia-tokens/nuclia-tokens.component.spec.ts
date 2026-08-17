import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SDKService } from '@flaps/core';
import { IKnowledgeBoxItem } from '@nuclia/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MockModule, MockProvider } from 'ng-mocks';
import { BehaviorSubject, of } from 'rxjs';
import { MetricsService } from '../metrics.service';
import { NucliaTokensComponent } from './nuclia-tokens.component';

const mockKb = (id: string): IKnowledgeBoxItem =>
  ({ id, slug: id, title: id, zone: 'zone', state: 'PRIVATE' }) as IKnowledgeBoxItem;

describe('NucliaTokensComponent', () => {
  let fixture: ComponentFixture<NucliaTokensComponent>;
  let component: NucliaTokensComponent;
  let sdkKbList$: BehaviorSubject<IKnowledgeBoxItem[]>;

  beforeEach(async () => {
    sdkKbList$ = new BehaviorSubject<IKnowledgeBoxItem[]>([]);

    await TestBed.configureTestingModule({
      imports: [NucliaTokensComponent, MockModule(TranslateModule)],
      providers: [
        MockProvider(SDKService, {
          kbList: sdkKbList$ as any,
          currentAccount: of({ id: 'acc-1', slug: 'acc-1-slug' }) as any,
          nuclia: {
            db: { getKnowledgeBoxes: jest.fn().mockReturnValue(of([])) },
            options: {},
          } as any,
        }),
        MockProvider(MetricsService, {
          isSubscribedToStripe: of(false),
          period: of({ start: new Date('2024-01-01'), end: new Date('2024-01-31') }),
          getLastMonths: jest.fn().mockReturnValue([]),
          getLastStripePeriods: jest.fn().mockReturnValue([]),
        }),
        MockProvider(TranslateService, { instant: jest.fn((key: string) => key) }),
      ],
    })
      .overrideComponent(NucliaTokensComponent, { set: { template: '<div></div>' } })
      .compileComponents();

    fixture = TestBed.createComponent(NucliaTokensComponent);
    component = fixture.componentInstance;
  });

  describe('kbList', () => {
    it('falls back to sdk.kbList when the kbs input is never set', () => {
      const emissions: IKnowledgeBoxItem[][] = [];
      component.kbList.subscribe((kbs) => emissions.push(kbs));

      expect(emissions[emissions.length - 1]).toEqual([]);

      sdkKbList$.next([mockKb('kb-fallback')]);
      expect(emissions[emissions.length - 1]).toEqual([mockKb('kb-fallback')]);
    });

    it('uses the parent-supplied kbs input instead of sdk.kbList once set', () => {
      const emissions: IKnowledgeBoxItem[][] = [];
      component.kbList.subscribe((kbs) => emissions.push(kbs));

      component.kbs = [mockKb('kb-a')];
      expect(emissions[emissions.length - 1]).toEqual([mockKb('kb-a')]);

      // sdk.kbList changing afterwards should have no effect once a kbs input has been provided.
      sdkKbList$.next([mockKb('kb-fallback')]);
      expect(emissions[emissions.length - 1]).toEqual([mockKb('kb-a')]);
    });

    it('emits incrementally as the parent grows the kbs input, mirroring the account-consumption incremental loading', () => {
      const emissions: IKnowledgeBoxItem[][] = [];
      component.kbList.subscribe((kbs) => emissions.push(kbs));

      component.kbs = [mockKb('kb-a')];
      expect(emissions[emissions.length - 1]).toEqual([mockKb('kb-a')]);

      component.kbs = [mockKb('kb-a'), mockKb('kb-b')];
      expect(emissions[emissions.length - 1]).toEqual([mockKb('kb-a'), mockKb('kb-b')]);
    });
  });

  describe('loading$', () => {
    it('is true while no usage has arrived yet', () => {
      const emissions: boolean[] = [];
      component.loading$.subscribe((loading) => emissions.push(loading));

      // Mirrors Angular's initial `[usage]="usage"` binding firing once with `undefined` while the parent is still loading.
      component.usage = undefined;
      expect(emissions[emissions.length - 1]).toBe(true);
    });

    it('becomes false once usage for the selected item is present', () => {
      const emissions: boolean[] = [];
      component.loading$.subscribe((loading) => emissions.push(loading));

      component.usage = { account: [{ metrics: [] } as any] };
      expect(emissions[emissions.length - 1]).toBe(false);
    });

    it('stays true for a selected item whose usage has not resolved yet, even if other keys already loaded', () => {
      const emissions: boolean[] = [];
      component.loading$.subscribe((loading) => emissions.push(loading));

      component.selectedItem.next('kb-a');
      component.usage = { account: [{ metrics: [] } as any] }; // 'kb-a' still missing
      expect(emissions[emissions.length - 1]).toBe(true);

      component.usage = { account: [{ metrics: [] } as any], 'kb-a': [{ metrics: [] } as any] };
      expect(emissions[emissions.length - 1]).toBe(false);
    });
  });
});
