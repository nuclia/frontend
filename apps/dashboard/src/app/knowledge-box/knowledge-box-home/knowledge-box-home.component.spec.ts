import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SDKService, STFTrackingService } from '@flaps/core';

import { KnowledgeBoxHomeComponent } from './knowledge-box-home.component';
import { of } from 'rxjs';
import { TranslateLoader, TranslateModule, TranslatePipe } from '@ngx-translate/core';
import * as EN from '../../../../../../libs/common/src/assets/i18n/en.json';
import { AppService, NavigationService } from '@flaps/common';
import { MockProvider } from 'ng-mocks';
import { RouterTestingModule } from '@angular/router/testing';

function createTranslateLoader() {
  return {
    getTranslation: () => of(EN),
  };
}

describe('KnowledgeBoxHomeComponent', () => {
  let component: KnowledgeBoxHomeComponent;
  let fixture: ComponentFixture<KnowledgeBoxHomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [KnowledgeBoxHomeComponent],
      imports: [
        RouterTestingModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: createTranslateLoader,
          },
          useDefaultLang: true,
          defaultLanguage: 'en',
        }),
      ],
      providers: [
        MockProvider(AppService),
        {
          provide: SDKService,
          useValue: {
            currentAccount: of({ slug: 'some-account' }),
            currentKb: of({ fullpath: 'http://somewhere/api' }),
            counters: of({ resources: 0 }),
            nuclia: { db: { getStats: () => of([]) } },
          },
        },
        {
          provide: STFTrackingService,
          useValue: {
            isFeatureEnabled: () => of(true),
          },
        },
        MockProvider(TranslatePipe),
        MockProvider(NavigationService),
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KnowledgeBoxHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should translate properly', () => {
    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('.endpoint-container .title-s').textContent).toContain('NucliaDB API endpoint');
  });
});