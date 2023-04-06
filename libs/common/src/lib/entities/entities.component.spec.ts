import { ComponentFixture, TestBed } from '@angular/core/testing';
import { STFTrackingService, TranslatePipeMock } from '@flaps/core';
import { of } from 'rxjs';
import { EntitiesService } from './entities.service';

import { EntitiesComponent } from './entities.component';
import { MockModule, MockProvider } from 'ng-mocks';
import { ModalService, PaButtonModule, PaModalModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { ReactiveFormsModule } from '@angular/forms';

describe('EntitiesComponent', () => {
  let component: EntitiesComponent;
  let fixture: ComponentFixture<EntitiesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MockModule(PaModalModule),
        MockModule(PaTextFieldModule),
        MockModule(PaButtonModule),
        MockModule(ReactiveFormsModule),
      ],
      declarations: [EntitiesComponent, TranslatePipeMock],
      providers: [
        {
          provide: EntitiesService,
          useValue: {
            getEntities: () => of({}),
          },
        },
        {
          provide: STFTrackingService,
          useValue: {
            isFeatureEnabled: () => of(false),
          },
        },
        MockProvider(ModalService),
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EntitiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
