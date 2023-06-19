import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OnboardingComponent } from './onboarding.component';
import { MockComponent, MockModule, MockPipe, MockProvider } from 'ng-mocks';
import { OnboardingService } from './onboarding.service';
import { STFTrackingService, ZoneService } from '@flaps/core';
import { of } from 'rxjs';
import {
  PaButtonModule,
  PaIconModule,
  PaTextFieldModule,
  PaTogglesModule,
  PaTranslateModule,
  TranslatePipe,
} from '@guillotinaweb/pastanaga-angular';
import { UserContainerComponent } from '../user-container';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';

describe('OnboardingComponent', () => {
  let component: OnboardingComponent;
  let fixture: ComponentFixture<OnboardingComponent>;

  let onboardingService: OnboardingService;

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
        MockProvider(OnboardingService, {
          startOnboarding: jest.fn(),
        }),
        MockProvider(ZoneService, { getZones: jest.fn(() => of([{ id: 'zoneId', slug: 'zone' }])) }),
        MockProvider(TranslateService, {
          instant: jest.fn((key) => `translate--${key}`),
        }),
        MockPipe(TranslatePipe, (key) => `translate--${key}`),
        {
          provide: STFTrackingService,
          useValue: {
            isFeatureEnabled: () => of(false),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OnboardingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('submitForm', () => {
    const data = {
      company: 'Atlas',
      use_case: 'Global site search',
      hosted_nucliadb: 'yes',
      organization_size: '1-50',
      phoneInternationalCode: '+11',
      phoneNumber: '111 111 111',
      getUpdates: true,
    };

    beforeEach(() => {
      onboardingService = TestBed.inject(OnboardingService);
    });

    it('should do nothing when form is not valid', () => {
      expect(component.onboardingForm.valid).toBe(false);
      component.submitForm();
      expect(onboardingService.startOnboarding).not.toHaveBeenCalled();
    });

    it('should call startOnboarding when form is valid', () => {
      component.onboardingForm.setValue(data);
      component.submitForm();
      expect(onboardingService.startOnboarding).toHaveBeenCalledWith(
        {
          company: data.company,
          use_case: data.use_case,
          hosted_nucliadb: true,
          organization_size: data.organization_size,
          phone: '+11 111 111 111',
          receive_updates: data.getUpdates,
        },
        'zoneId',
      );
    });
  });
});
