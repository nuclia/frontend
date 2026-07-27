import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { KnowledgeBoxHomeComponent } from './knowledge-box-home.component';
import { of } from 'rxjs';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
// eslint-disable-next-line @nx/enforce-module-boundaries
import * as EN from '../../../../../../libs/common/src/assets/i18n/en.json';
import { MockComponent, MockModule, MockProvider } from 'ng-mocks';
import {
  AccountStatusComponent,
  AppService,
  GenerativeModelPipe,
  MetricsService,
  RemiMetricsService,
  UploadModule,
  UploadService,
} from '@flaps/common';
import {
  FeaturesService,
  NavigationService,
  SDKService,
  UploadEventService,
  ZoneService,
  STFPipesModule,
} from '@flaps/core';
import { DropdownButtonComponent, HomeContainerComponent, SisModalService } from '@nuclia/sistema';
import { Account, WritableKnowledgeBox } from '@nuclia/core';
import {
  PaButtonModule,
  PaDropdownModule,
  PaIconModule,
  PaPopupModule,
  PaTableModule,
  PaTabsModule,
  PaTooltipModule,
} from '@guillotinaweb/pastanaga-angular';
import { UsageChartsComponent } from './kb-usage/usage-charts.component';
import { RouterModule } from '@angular/router';
import { KbOnboardingHeaderComponent } from './kb-onboarding/kb-onboarding-header.component';
import { KbOnboardingStateService } from './kb-onboarding/kb-onboarding-state.service';
import { ContentPlaceholderComponent } from './content-placeholder/content-placeholder.component';
import { LastResourcesComponent } from './last-resources/last-resources.component';

function createTranslateLoader() {
  return {
    getTranslation: () => of(EN),
  };
}

describe('KnowledgeBoxHomeComponent', () => {
  let component: KnowledgeBoxHomeComponent;
  let fixture: ComponentFixture<KnowledgeBoxHomeComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [KnowledgeBoxHomeComponent],
        imports: [
          TranslateModule.forRoot({
            loader: {
              provide: TranslateLoader,
              useFactory: createTranslateLoader,
            },
            useDefaultLang: true,
            defaultLanguage: 'en',
          }),
          MockModule(PaButtonModule),
          MockModule(PaDropdownModule),
          MockModule(PaIconModule),
          MockModule(PaPopupModule),
          MockModule(PaTableModule),
          MockModule(PaTabsModule),
          MockModule(PaTooltipModule),
          MockModule(RouterModule),
          MockModule(UploadModule),
          STFPipesModule,
          GenerativeModelPipe,
          MockComponent(DropdownButtonComponent),
          MockComponent(AccountStatusComponent),
          MockComponent(HomeContainerComponent),
          MockComponent(UsageChartsComponent),
          MockComponent(KbOnboardingHeaderComponent),
          MockComponent(ContentPlaceholderComponent),
          MockComponent(LastResourcesComponent),
        ],
        providers: [
          MockProvider(AppService, {
            currentLocale: of('en'),
          }),
          MockProvider(SDKService, {
            currentKb: of({
              id: 'kb-id',
              slug: 'kb-slug',
              state: 'PRIVATE',
              zone: 'test-zone',
              fullpath: 'http://somewhere/api',
              getConfiguration: () => of({}),
              catalog: () => of({ type: 'searchResults' }),
              counters: () => of({ resources: 0, paragraphs: 0, fields: 0, sentences: 0 }),
              processingStatus: () => of({ results: [] }),
            } as unknown as WritableKnowledgeBox),
            currentAccount: of({
              id: 'test-id',
              slug: 'test-account',
              title: 'Test Account',
              zone: 'test-zone',
              type: 'stash-trial',
              can_manage_account: true,
              blocked_features: [],
              max_kbs: 10,
              max_agents: 5,
              max_memories: 5,
              max_arags: 5,
              max_users: 100,
              creation_date: '2023-01-01',
            } as Account),
            counters: of({ resources: 1, index_size: 1024, paragraphs: 2, fields: 3, sentences: 4 }),
            refreshCounter: jest.fn(),
            nuclia: {
              options: { standalone: false, backend: 'https://nuclia.cloud' },
              db: {},
            },
          } as SDKService),
          MockProvider(FeaturesService, {
            isTrial: of(true),
            isAccountManager: of(true),
            isKbAdmin: of(true),
            authorized: {
              remiMetrics: of(false),
            },
          } as FeaturesService),
          MockProvider(NavigationService, {
            getKbUrl: () => 'kb-url',
          }),
          MockProvider(UploadService, {
            getResourceStatusCount: () => of({ type: 'searchResults' }),
          }),
          {
            provide: MetricsService,
            useValue: {
              getUsageCharts: () => of({}),
              getSearchCharts: () => of({ search: {}, ask: {} }),
              getUsageCount: () => of(0),
              getSearchCount: () => of({ month: { search: 0, chat: 0 }, year: { search: 0, chat: 0 } }),
              isSubscribedToStripe: of(false),
              period: of({ start: new Date(), end: new Date() }),
              getLastMonths: () => [{ start: new Date(), end: new Date() }],
              getLastStripePeriods: () => [{ start: new Date(), end: new Date() }],
            },
          },
          MockProvider(SisModalService, {
            openModal: jest.fn(),
          }),
          {
            provide: ZoneService,
            useValue: {
              getZones: () =>
                of([
                  {
                    slug: 'test-zone',
                    title: 'Test Zone',
                    id: 'test-id',
                    cloud_provider: 'test',
                    private: false,
                    origin: null,
                  },
                ]),
              buildZoneUrl: () => of('https://test-zone.nuclia.cloud'),
            },
          },
          MockProvider(RemiMetricsService, {
            healthCheckData: of([]),
            updatePeriod: jest.fn(),
          }),
          MockProvider(KbOnboardingStateService, {
            onboardingState$: of(null),
            updateState: jest.fn(),
            skip: jest.fn(),
            restart: jest.fn(),
            markDone: jest.fn(),
          }),
          MockProvider(UploadEventService, {
            processingStarted$: of(false),
            searchPerformed$: of(false),
            clearProcessingStarted: jest.fn(),
            clearSearchPerformed: jest.fn(),
          }),
        ],
      }).compileComponents();
    }),
    7000,
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(KnowledgeBoxHomeComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render onboarding header', () => {
    fixture.detectChanges();
    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('app-kb-onboarding-header')).toBeTruthy();
  });

  it('should render the KB summary cards on the top row', () => {
    fixture.detectChanges();
    const compiled = fixture.debugElement.nativeElement;
    const summaryCards = compiled.querySelectorAll('.kb-summary-card');

    expect(summaryCards).toHaveLength(4);
    expect(summaryCards[0].textContent).toContain('Region');
    expect(summaryCards[1].textContent).toContain('Generative model');
    expect(summaryCards[2].textContent).toContain('Knowledge Box status');
    expect(summaryCards[3].textContent).toContain('Embeddings model');
  });

  it('should not render the standalone storage card anymore', () => {
    fixture.detectChanges();
    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('.kb-storage')).toBeFalsy();
  });

  it('should not render the old KB details card anymore', () => {
    fixture.detectChanges();
    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('.kb-details')).toBeFalsy();
  });

  it('should not render onboarding header for non-admin users', () => {
    const features = TestBed.inject(FeaturesService);
    (features.isKbAdmin as unknown) = of(false);

    fixture = TestBed.createComponent(KnowledgeBoxHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('app-kb-onboarding-header')).toBeFalsy();
  });
});
