import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SDKService, StateService, STFTrackingService, TranslatePipeMock } from '@flaps/core';
import { AppService } from '../../services/app.service';

import { KnowledgeBoxHomeComponent } from './knowledge-box-home.component';
import { of } from 'rxjs';
import { TranslateLoader, TranslateModule, TranslatePipe } from '@ngx-translate/core';
import * as EN from '../../../../../../libs/common/src/assets/i18n/en.json';
import { MatDialogModule } from '@angular/material/dialog';

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
            nuclia: { db: { getStats: () => of([]) } },
          },
        },
        {
          provide: StateService,
          useValue: { account: of({ slug: 'some-account' }) },
        },
        {
          provide: STFTrackingService,
          useValue: {
            isFeatureEnabled: () => of(true),
          },
        },
        { provide: TranslatePipe, useClass: TranslatePipeMock },
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
    expect(compiled.querySelector('.get-started .title-m').textContent).toContain('Get started');
  });
});
