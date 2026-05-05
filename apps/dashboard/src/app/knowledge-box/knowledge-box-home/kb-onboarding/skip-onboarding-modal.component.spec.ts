import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MockModule, MockProvider } from 'ng-mocks';
import { ModalConfig, ModalRef, PaButtonModule, PaModalModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';

import { SkipOnboardingModalComponent } from './skip-onboarding-modal.component';
import { KbOnboardingStateService } from './kb-onboarding-state.service';

describe('SkipOnboardingModalComponent', () => {
  let component: SkipOnboardingModalComponent;
  let fixture: ComponentFixture<SkipOnboardingModalComponent>;
  let modalRef: ModalRef;
  let stateService: KbOnboardingStateService;

  beforeEach(async () => {
    modalRef = new ModalRef({ id: 0, config: new ModalConfig({}) });
    jest.spyOn(modalRef, 'close');

    await TestBed.configureTestingModule({
      imports: [
        SkipOnboardingModalComponent,
        MockModule(PaButtonModule),
        MockModule(PaModalModule),
        MockModule(TranslateModule),
      ],
      providers: [
        { provide: ModalRef, useValue: modalRef },
        MockProvider(KbOnboardingStateService, {
          skip: jest.fn(),
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SkipOnboardingModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    stateService = TestBed.inject(KbOnboardingStateService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('confirmSkip()', () => {
    it('should call KbOnboardingStateService.skip()', () => {
      component.confirmSkip();

      expect(stateService.skip).toHaveBeenCalledTimes(1);
    });

    it('should call ModalRef.close()', () => {
      component.confirmSkip();

      expect(modalRef.close).toHaveBeenCalledTimes(1);
    });

    it('should call skip() before close()', () => {
      const callOrder: string[] = [];
      jest.spyOn(stateService, 'skip').mockImplementation(() => callOrder.push('skip'));
      jest.spyOn(modalRef, 'close').mockImplementation(() => callOrder.push('close'));

      component.confirmSkip();

      expect(callOrder).toEqual(['skip', 'close']);
    });
  });

  describe('cancel / close without confirming', () => {
    it('should NOT call KbOnboardingStateService.skip() when modal is closed directly', () => {
      // Simulate the cancel button calling modal.close() without confirmSkip()
      component.modal.close();

      expect(stateService.skip).not.toHaveBeenCalled();
    });
  });
});
