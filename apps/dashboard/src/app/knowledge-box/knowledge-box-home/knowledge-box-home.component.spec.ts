import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { KnowledgeBoxHomeComponent } from './knowledge-box-home.component';
import { of } from 'rxjs';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import * as EN from '../../../../../../libs/common/src/assets/i18n/en.json';
import { MockComponent, MockModule, MockProvider } from 'ng-mocks';
import { AppService, RemiMetricsService, UploadModule, UploadService } from '@flaps/common';
import { FeaturesService, NavigationService, SDKService, ZoneService, STFPipesModule } from '@flaps/core';
import { MetricsService } from '../../account/metrics.service';
import { DropdownButtonComponent, HomeContainerComponent, SisModalService } from '@nuclia/sistema';
import { Account, WritableKnowledgeBox } from '@nuclia/core';
import {
  PaButtonModule,
  PaDropdownModule,
  PaIconModule,
  PaTableModule,
  PaTabsModule,
} from '@guillotinaweb/pastanaga-angular';
import { UsageChartsComponent } from './kb-usage/usage-charts.component';
import { AccountStatusComponent } from '../../account/account-status/account-status.component';
import { RouterModule } from '@angular/router';

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
          MockModule(PaTableModule),
          MockModule(PaTabsModule),
          MockModule(RouterModule),
          MockModule(UploadModule),
          STFPipesModule,
          MockComponent(DropdownButtonComponent),
          MockComponent(AccountStatusComponent),
          MockComponent(HomeContainerComponent),
          MockComponent(UsageChartsComponent),
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
              max_arags: 5,
              max_users: 100,
              creation_date: '2023-01-01',
            } as Account),
            counters: of({}),
            nuclia: {
              options: { standalone: false },
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
              getSearchCount: () => of(0),
              isSubscribedToStripe: of(false),
              period: of({ start: new Date(), end: new Date() }),
            },
          },
          MockProvider(SisModalService),
          {
            provide: ZoneService,
            useValue: {
              getZones: () =>
                of([
                  { slug: 'test-zone', title: 'Test Zone', id: 'test-id', cloud_provider: 'test', subdomain: 'test' },
                ]),
            },
          },
          MockProvider(RemiMetricsService),
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

  it('should translate properly', () => {
    fixture.detectChanges();
    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('[data-cy="nucliadb-endpoint"]').textContent).toContain('NucliaDB API endpoint');
  });
});
