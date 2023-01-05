import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OnboardingComponent } from './onboarding.component';
import { MockComponent, MockModule, MockPipe, MockProvider } from 'ng-mocks';
import { OnboardingService } from './onboarding.service';
import { ZoneService } from '@flaps/core';
import { of } from 'rxjs';
import {
  PaButtonModule,
  PaIconModule,
  PaTextFieldModule,
  PaTogglesModule,
  PaTranslateModule,
  TranslatePipe,
} from '@guillotinaweb/pastanaga-angular';
import { UserContainerComponent } from '@flaps/common';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';

describe('OnboardingComponent', () => {
  let component: OnboardingComponent;
  let fixture: ComponentFixture<OnboardingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MockModule(PaTextFieldModule),
        MockModule(PaTogglesModule),
        MockModule(PaButtonModule),
        MockModule(PaIconModule),
        MockModule(PaTranslateModule),
        MockModule(ReactiveFormsModule),
      ],
      declarations: [OnboardingComponent, MockComponent(UserContainerComponent)],
      providers: [
        MockProvider(OnboardingService),
        MockProvider(ZoneService, { getZones: jest.fn(() => of([{ id: 'zoneId', slug: 'zone' }])) }),
        MockProvider(TranslateService, {
          instant: jest.fn((key) => `translate--${key}`),
        }),
        MockPipe(TranslatePipe, (key) => `translate--${key}`),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OnboardingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
