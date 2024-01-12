import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FeaturesService, SDKService, TranslatePipeMock } from '@flaps/core';
import { TrainingStatus } from '@nuclia/core';
import { of } from 'rxjs';

import { KnowledgeBoxTrainingComponent } from './knowledge-box-training.component';
import { MockModule, MockProvider } from 'ng-mocks';
import {
  PaButtonModule,
  PaDropdownModule,
  PaIconModule,
  PaPopupModule,
  PaTextFieldModule,
  PaTogglesModule,
} from '@guillotinaweb/pastanaga-angular';
import { DropdownButtonComponent } from '@nuclia/sistema';
import { SvgIconRegistryService } from 'angular-svg-icon';
import { TranslateService } from '@ngx-translate/core';

describe('KnowledgeBoxTrainingComponent', () => {
  let component: KnowledgeBoxTrainingComponent;
  let fixture: ComponentFixture<KnowledgeBoxTrainingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MockModule(PaTextFieldModule),
        MockModule(PaDropdownModule),
        MockModule(PaButtonModule),
        MockModule(PaTogglesModule),
        MockModule(PaIconModule),
        MockModule(PaPopupModule),
        DropdownButtonComponent,
      ],
      declarations: [KnowledgeBoxTrainingComponent, TranslatePipeMock],
      providers: [
        {
          provide: SDKService,
          useValue: {
            currentAccount: of({ type: 'stash-enterprise' }),
            currentKb: of({ getStatus: () => TrainingStatus.not_running }),
            counters: of({ resources: 1 }),
          },
        },
        MockProvider(FeaturesService, { trainingNer: of(true) }),
        { provide: SvgIconRegistryService, useValue: { loadSvg: () => {} } },
        MockProvider(TranslateService),
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KnowledgeBoxTrainingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
