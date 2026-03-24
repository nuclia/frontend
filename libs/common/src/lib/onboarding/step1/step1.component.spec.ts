import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FeaturesService } from '@flaps/core';
import { TranslateModule } from '@ngx-translate/core';
import { MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { Step1Component } from './step1.component';

describe('Step1Component', () => {
  let component: Step1Component;
  let fixture: ComponentFixture<Step1Component>;

  beforeAll(() => {
    Object.defineProperty(globalThis, 'ResizeObserver', {
      writable: true,
      configurable: true,
      value: class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    });
  });

  async function createComponent(progressComSignup: boolean, detectChanges = true) {
    await TestBed.configureTestingModule({
      imports: [Step1Component, TranslateModule.forRoot()],
      providers: [
        MockProvider(FeaturesService, {
          unstable: {
            progressComSignup: of(progressComSignup),
          },
        } as unknown as FeaturesService),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Step1Component);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('isAws', false);
    if (detectChanges) {
      fixture.detectChanges();
    }
  }

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should hide non-checkbox fields when progress.com signup is enabled', async () => {
    await createComponent(true);

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('#company')).toBeNull();
    expect(element.querySelector('#use_case')).toBeNull();
    expect(element.querySelector('#orgSize')).toBeNull();
    expect(element.querySelector('#role')).toBeNull();
    expect(element.querySelector('#country')).toBeNull();
    expect(element.querySelector('#phoneNumber')).toBeNull();
    expect(element.querySelectorAll('pa-checkbox')).toHaveLength(2);
  });

  it('should only require the privacy policy checkbox when progress.com signup is enabled', async () => {
    await createComponent(true);

    expect(component.onboardingForm.valid).toBe(false);

    component.onboardingForm.controls.acceptPrivacyPolicy.setValue(true);
    fixture.detectChanges();

    expect(component.onboardingForm.valid).toBe(true);
  });

  it('should keep regular required fields when progress.com signup is disabled', async () => {
    await createComponent(false, false);

    component.onboardingForm.controls.acceptPrivacyPolicy.setValue(true);

    expect(component.onboardingForm.controls.company.hasError('required')).toBe(true);
    expect(component.onboardingForm.valid).toBe(false);
  });
});
