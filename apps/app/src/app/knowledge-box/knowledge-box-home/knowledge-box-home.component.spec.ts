import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslatePipeMock } from '@flaps/core';
import { SDKService, StateService } from '@flaps/auth';
import { HelpBoxesService } from '../../services/help-boxes.service';
import { AppService } from '../../services/app.service';

import { KnowledgeBoxHomeComponent } from './knowledge-box-home.component';
import { of } from 'rxjs';
import { TranslateLoader, TranslateModule, TranslatePipe } from '@ngx-translate/core';
import * as EN from '../../../../../../libs/common/src/assets/i18n/en.json';
import { MatDialogModule } from '@angular/material/dialog';
import { STFTrackingService } from '@flaps/auth';

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
        MatDialogModule,
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
        {
          provide: AppService,
          useValue: {},
        },
        {
          provide: SDKService,
          useValue: {
            currentKb: of({ fullpath: 'http://somewhere/api' }),
            counters: of({ resources: 0 }),
            nuclia: { db: { getStats: (account: string, type: 'search' | 'processing') => of([]) } },
          },
        },
        {
          provide: StateService,
          useValue: { account: of({ slug: 'some-account' }) },
        },
        {
          provide: HelpBoxesService,
          useValue: {
            isTourCompleted: () => {},
            initializeTour: () => {},
            startTour: () => {},
          },
        },
        { provide: TranslatePipe, useClass: TranslatePipeMock },
        {
          provide: STFTrackingService,
          useValue: {
            isFeatureEnabled: () => of(true),
          },
        },
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
    expect(compiled.querySelector('.get-started span').textContent).toContain('Get started');
  });
});
