import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MockModule, MockProvider } from 'ng-mocks';
import { ModalConfig, ModalRef, PaButtonModule, PaModalModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';

import { RestartOnboardingModalComponent } from './restart-onboarding-modal.component';
import { KbOnboardingStateService } from './kb-onboarding-state.service';

describe('RestartOnboardingModalComponent', () => {
  let component: RestartOnboardingModalComponent;
  let fixture: ComponentFixture<RestartOnboardingModalComponent>;
  let modalRef: ModalRef;
  let stateService: KbOnboardingStateService;

  beforeEach(async () => {
    modalRef = new ModalRef({ id: 0, config: new ModalConfig({}) });
    jest.spyOn(modalRef, 'close');

    await TestBed.configureTestingModule({
      imports: [
        RestartOnboardingModalComponent,
        MockModule(PaButtonModule),
        MockModule(PaModalModule),
        MockModule(TranslateModule),
      ],
      providers: [
        { provide: ModalRef, useValue: modalRef },
        MockProvider(KbOnboardingStateService, {
          restart: jest.fn(),
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RestartOnboardingModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    stateService = TestBed.inject(KbOnboardingStateService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('confirmRestart()', () => {
    it('should call KbOnboardingStateService.restart()', () => {
      component.confirmRestart();

      expect(stateService.restart).toHaveBeenCalledTimes(1);
    });

    it('should call ModalRef.close()', () => {
      component.confirmRestart();

      expect(modalRef.close).toHaveBeenCalledTimes(1);
    });

    it('should call restart() before close()', () => {
      const callOrder: string[] = [];
      jest.spyOn(stateService, 'restart').mockImplementation(() => callOrder.push('restart'));
      jest.spyOn(modalRef, 'close').mockImplementation(() => callOrder.push('close'));

      component.confirmRestart();

      expect(callOrder).toEqual(['restart', 'close']);
    });
  });

  describe('cancel / close without confirming', () => {
    it('should NOT call KbOnboardingStateService.restart() when modal is closed directly', () => {
      // Simulate the cancel button calling modal.close() without confirmRestart()
      component.modal.close();

      expect(stateService.restart).not.toHaveBeenCalled();
    });
  });
});
