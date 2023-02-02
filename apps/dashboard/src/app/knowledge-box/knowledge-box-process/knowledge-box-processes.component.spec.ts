import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SDKService, STFTrackingService, TranslatePipeMock } from '@flaps/core';
import { TrainingStatus } from '@nuclia/core';
import { of } from 'rxjs';

import { KnowledgeBoxProcessesComponent } from './knowledge-box-processes.component';
import { MockModule } from 'ng-mocks';
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

describe('KnowledgeBoxProcessComponent', () => {
  let component: KnowledgeBoxProcessesComponent;
  let fixture: ComponentFixture<KnowledgeBoxProcessesComponent>;

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
      declarations: [KnowledgeBoxProcessesComponent, TranslatePipeMock],
      providers: [
        {
          provide: SDKService,
          useValue: {
            currentKb: of({ getStatus: () => TrainingStatus.not_running }),
            counters: of({ resources: 1 }),
          },
        },
        {
          provide: STFTrackingService,
          useValue: {
            isFeatureEnabled: jest.fn(() => of(true)),
          },
        },
        { provide: SvgIconRegistryService, useValue: { loadSvg: () => {} } },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KnowledgeBoxProcessesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
