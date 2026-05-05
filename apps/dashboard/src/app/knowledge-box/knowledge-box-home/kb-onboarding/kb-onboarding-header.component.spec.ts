import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { of } from 'rxjs';
import { MockComponent, MockModule, MockProvider } from 'ng-mocks';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import {
  PaButtonModule,
  PaIconModule,
  PaModalModule,
  PaTogglesModule,
  PaTooltipModule,
  ModalConfig,
} from '@guillotinaweb/pastanaga-angular';
import { InfoCardComponent, SisModalService } from '@nuclia/sistema';
// eslint-disable-next-line @nx/enforce-module-boundaries
import * as EN from '../../../../../../../libs/common/src/assets/i18n/en.json';

// pa-checkbox uses ResizeObserver via paEllipsisTooltip
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).ResizeObserver = class {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  observe() {}
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  unobserve() {}
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  disconnect() {}
};

import { KbOnboardingHeaderComponent } from './kb-onboarding-header.component';
import { KbOnboardingStateService } from './kb-onboarding-state.service';
import { KbOnboardingEntry } from './kb-onboarding-state.model';
import { SkipOnboardingModalComponent } from './skip-onboarding-modal.component';
import { RestartOnboardingModalComponent } from './restart-onboarding-modal.component';

function createTranslateLoader() {
  return { getTranslation: () => of(EN) };
}

describe('KbOnboardingHeaderComponent', () => {
  let component: KbOnboardingHeaderComponent;
  let fixture: ComponentFixture<KbOnboardingHeaderComponent>;
  let stateSubject: BehaviorSubject<KbOnboardingEntry | null>;

  async function createComponent(initialState: KbOnboardingEntry | null): Promise<void> {
    stateSubject = new BehaviorSubject<KbOnboardingEntry | null>(initialState);

    await TestBed.configureTestingModule({
      imports: [
        KbOnboardingHeaderComponent,
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useFactory: createTranslateLoader },
          useDefaultLang: true,
          defaultLanguage: 'en',
        }),
        MockModule(PaButtonModule),
        MockModule(PaIconModule),
        MockModule(PaModalModule),
        MockModule(PaTogglesModule),
        MockModule(PaTooltipModule),
        MockModule(RouterModule),
        MockComponent(InfoCardComponent),
      ],
      providers: [
        MockProvider(KbOnboardingStateService, {
          onboardingState$: stateSubject.asObservable(),
        }),
        MockProvider(SisModalService, {
          openModal: jest.fn(),
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(KbOnboardingHeaderComponent);
    component = fixture.componentInstance;
    // Required signal input must be set before first detectChanges()
    fixture.componentRef.setInput('kbUrl', '/kb/test');
    fixture.detectChanges();
  }

  afterEach(() => TestBed.resetTestingModule());

  // ─── Template section rendering ─────────────────────────────────────────────

  describe('state: uploading-data (not skipped)', () => {
    beforeEach(async () => {
      await createComponent({ skipped: false, currentStep: 'uploading-data' });
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should render step1 title', () => {
      const h2 = fixture.nativeElement.querySelector('h2');
      expect(h2).toBeTruthy();
      expect(h2.textContent.trim()).toContain("Let's upload your data first");
    });

    it('should show the upload button', () => {
      const btn = fixture.nativeElement.querySelector('pa-button[icon="upload"]');
      expect(btn).toBeTruthy();
    });

    it('should show the skip button', () => {
      const skipBtn = fixture.nativeElement.querySelector('pa-button[icon="cross"]');
      expect(skipBtn).toBeTruthy();
    });
  });

  describe('state: processing-data (not skipped)', () => {
    beforeEach(async () => {
      await createComponent({ skipped: false, currentStep: 'processing-data' });
    });

    it('should render step2 title', () => {
      const h2 = fixture.nativeElement.querySelector('h2');
      expect(h2).toBeTruthy();
      expect(h2.textContent.trim()).toContain('Your data is being processed');
    });

    it('should show the info card with processing description', () => {
      const infoCard = fixture.nativeElement.querySelector('nsi-info-card');
      expect(infoCard).toBeTruthy();
    });
  });

  describe('state: searching-data (not skipped)', () => {
    beforeEach(async () => {
      await createComponent({ skipped: false, currentStep: 'searching-data' });
    });

    it('should render step3 title', () => {
      const h2 = fixture.nativeElement.querySelector('h2');
      expect(h2).toBeTruthy();
      expect(h2.textContent.trim()).toContain("Now let's get some answers from your data");
    });

    it('should show the Try Search button', () => {
      const btn = fixture.nativeElement.querySelector('pa-button[icon="search"]');
      expect(btn).toBeTruthy();
    });
  });

  describe('state: uploading-data (skipped)', () => {
    beforeEach(async () => {
      await createComponent({ skipped: true, currentStep: 'uploading-data' });
    });

    it('should render skipped step1 title', () => {
      const h2 = fixture.nativeElement.querySelector('h2');
      expect(h2).toBeTruthy();
      expect(h2.textContent.trim()).toContain('You need to upload some data first');
    });

    it('should show the upload button', () => {
      const btn = fixture.nativeElement.querySelector('pa-button[icon="upload"]');
      expect(btn).toBeTruthy();
    });

    it('should show the restart button', () => {
      const restartBtn = fixture.nativeElement.querySelector('pa-button[icon="help"]');
      expect(restartBtn).toBeTruthy();
    });
  });

  describe('state: processing-data (skipped)', () => {
    beforeEach(async () => {
      await createComponent({ skipped: true, currentStep: 'processing-data' });
    });

    it('should render skipped step2 title', () => {
      const h2 = fixture.nativeElement.querySelector('h2');
      expect(h2).toBeTruthy();
      expect(h2.textContent.trim()).toContain('Your data is being processed');
    });

    it('should show the info card', () => {
      const card = fixture.nativeElement.querySelector('nsi-info-card');
      expect(card).toBeTruthy();
    });
  });

  describe('state: null (done)', () => {
    beforeEach(async () => {
      await createComponent(null);
    });

    it('should render the done title', () => {
      const h2 = fixture.nativeElement.querySelector('h2');
      expect(h2).toBeTruthy();
      expect(h2.textContent.trim()).toContain('Your Knowledge Box is Ready');
    });

    it('should show the done state', () => {
      const done = fixture.nativeElement.querySelector('.onboarding-content--done');
      expect(done).toBeTruthy();
    });
  });

  // ─── Interactions ────────────────────────────────────────────────────────────

  describe('skip button click', () => {
    beforeEach(async () => {
      await createComponent({ skipped: false, currentStep: 'uploading-data' });
    });

    it('should call SisModalService.openModal with SkipOnboardingModalComponent', () => {
      const skipBtn = fixture.nativeElement.querySelector('pa-button[icon="cross"]');
      expect(skipBtn).toBeTruthy();

      skipBtn.click();
      fixture.detectChanges();

      const modalService = TestBed.inject(SisModalService);
      expect(modalService.openModal).toHaveBeenCalledWith(SkipOnboardingModalComponent, expect.any(ModalConfig));
    });
  });

  describe('restart button click', () => {
    beforeEach(async () => {
      await createComponent({ skipped: true, currentStep: 'uploading-data' });
    });

    it('should call SisModalService.openModal with RestartOnboardingModalComponent', () => {
      const restartBtn = fixture.nativeElement.querySelector('pa-button[icon="help"]');
      expect(restartBtn).toBeTruthy();

      restartBtn.click();
      fixture.detectChanges();

      const modalService = TestBed.inject(SisModalService);
      expect(modalService.openModal).toHaveBeenCalledWith(RestartOnboardingModalComponent, expect.any(ModalConfig));
    });
  });
});
