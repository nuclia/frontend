import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PostHogService, SDKService, TranslatePipeMock } from '@flaps/core';
import { TrainingStatus } from '@nuclia/core';
import { of } from 'rxjs';

import { KnowledgeBoxProcessesComponent } from './knowledge-box-processes.component';
import { MockModule } from 'ng-mocks';
import {
  PaButtonModule,
  PaDropdownModule,
  PaTextFieldModule,
  PaTogglesModule,
  PaIconModule,
  PaPopupModule,
} from '@guillotinaweb/pastanaga-angular';

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
      ],
      declarations: [KnowledgeBoxProcessesComponent, TranslatePipeMock],
      providers: [
        {
          provide: SDKService,
          useValue: {
            currentKb: of({ getStatus: () => TrainingStatus.not_running }),
          },
        },
        {
          provide: PostHogService,
          useValue: {
            isFeatureEnabled: jest.fn(() => of(true)),
          },
        },
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
