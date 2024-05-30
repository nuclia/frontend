import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { KnowledgeBoxHomeComponent } from './knowledge-box-home.component';
import { of } from 'rxjs';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import * as EN from '../../../../../../libs/common/src/assets/i18n/en.json';
import { MockComponent, MockModule, MockProvider } from 'ng-mocks';
import { AppService, UploadModule, UploadService } from '@flaps/common';
import { FeaturesService, NavigationService, SDKService, STFTrackingService, ZoneService } from '@flaps/core';
import { MetricsService } from '../../account/metrics.service';
import { DropdownButtonComponent, HomeContainerComponent, SisModalService } from '@nuclia/sistema';
import { Account, WritableKnowledgeBox } from '@nuclia/core';
import { KbMetricsComponent } from './kb-metrics/kb-metrics.component';
import { PaButtonModule, PaDropdownModule, PaTableModule } from '@guillotinaweb/pastanaga-angular';
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

  beforeEach(waitForAsync(() => {
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
        MockModule(PaTableModule),
        MockModule(RouterModule),
        MockModule(UploadModule),
        MockComponent(DropdownButtonComponent),
        MockComponent(AccountStatusComponent),
        MockComponent(HomeContainerComponent),
        MockComponent(KbMetricsComponent),
        MockComponent(UsageChartsComponent),
      ],
      providers: [
        MockProvider(AppService),
        MockProvider(SDKService, {
          currentKb: of({
            id: 'kb-id',
            slug: 'kb-slug',
            state: 'PRIVATE',
            fullpath: 'http://somewhere/api',
            getConfiguration: () => of({}),
            catalog: () => of({ type: 'searchResults' }),
          } as unknown as WritableKnowledgeBox),
          currentAccount: of({} as Account),
          nuclia: {
            options: { standalone: false },
            db: {},
          },
        } as SDKService),
        MockProvider(STFTrackingService, { logEvent: () => {} }),
        MockProvider(FeaturesService, {
          isTrial: of(true),
          isAccountManager: of(true),
          isKbAdmin: of(true),
        } as FeaturesService),
        MockProvider(NavigationService, {
          getKbUrl: () => 'kb-url',
        }),
        MockProvider(UploadService, {
          getResourceStatusCount: () => of({ type: 'searchResults' }),
        }),
        MockProvider(MetricsService),
        MockProvider(SisModalService),
        MockProvider(ZoneService),
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KnowledgeBoxHomeComponent);
    component = fixture.componentInstance;
  }, 7000);

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should translate properly', () => {
    fixture.detectChanges();
    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('.kb-details .title-xxs').textContent).toContain('NucliaDB API endpoint');
  });
});
