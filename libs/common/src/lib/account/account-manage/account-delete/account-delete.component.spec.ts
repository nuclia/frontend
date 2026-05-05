import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ModalRef, ModalConfig } from '@guillotinaweb/pastanaga-angular';
import { AccountVerificationService, NavigationService, SDKService, UserService } from '@flaps/core';
import { SisToastService } from '@nuclia/sistema';
import { MockModule, MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { AccountDeleteComponent } from './account-delete.component';

function makeModalRef(): ModalRef {
  return new ModalRef({ id: 0, config: new ModalConfig() });
}

describe('AccountDeleteComponent', () => {
  let component: AccountDeleteComponent;
  let fixture: ComponentFixture<AccountDeleteComponent>;
  let modalRef: ModalRef;

  // Default mock values — overridden per-test where needed
  const mockAccount = { slug: 'test-account' };
  let deleteAccountMock: jest.Mock;
  let deleteAuthenticatedUserMock: jest.Mock;
  let verificationService: {
    supportsForceReauth: jest.Mock;
    isRecentlyVerified: jest.Mock;
    forceReauth: jest.Mock;
    requestEmailOtp: jest.Mock;
    hasPendingDelete: jest.Mock;
    clearPendingDelete: jest.Mock;
  };

  beforeEach(async () => {
    modalRef = makeModalRef();
    deleteAccountMock = jest.fn().mockReturnValue(of(undefined));
    deleteAuthenticatedUserMock = jest.fn().mockReturnValue(of(undefined));

    verificationService = {
      supportsForceReauth: jest.fn().mockReturnValue(false),
      isRecentlyVerified: jest.fn().mockReturnValue(false),
      forceReauth: jest.fn(),
      requestEmailOtp: jest.fn().mockReturnValue(of(undefined)),
      hasPendingDelete: jest.fn().mockReturnValue(false),
      clearPendingDelete: jest.fn(),
    };

    await TestBed.configureTestingModule({
      declarations: [AccountDeleteComponent],
      imports: [MockModule(TranslateModule)],
      providers: [
        { provide: ModalRef, useValue: modalRef },
        MockProvider(SDKService, {
          currentAccount: of(mockAccount as any),
          cleanAccount: jest.fn(),
          nuclia: {
            db: {
              getWelcome: jest.fn().mockReturnValue(of({ accounts: [] })),
              deleteAccount: deleteAccountMock,
            },
            auth: {
              deleteAuthenticatedUser: deleteAuthenticatedUserMock,
            },
          } as any,
        }),
        MockProvider(UserService, {
          userPrefs: of({ email: 'test@example.com' } as any),
          updateWelcome: jest.fn().mockReturnValue(of(undefined)),
        }),
        MockProvider(NavigationService, {
          getAccountSelectUrl: jest.fn().mockReturnValue('/select-account'),
        }),
        MockProvider(Router),
        MockProvider(SisToastService, { error: jest.fn(), success: jest.fn() }),
        { provide: AccountVerificationService, useValue: verificationService },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountDeleteComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  // ─── ngOnInit — secure verification paths ───────────────────────────────────

  describe('secure verification', () => {
    describe('reauth path — recent verification', () => {
      it('sets step to "confirm" when supportsForceReauth is true and isRecentlyVerified is true', () => {
        verificationService.supportsForceReauth.mockReturnValue(true);
        verificationService.isRecentlyVerified.mockReturnValue(true);

        fixture.detectChanges(); // triggers ngOnInit

        expect(component.step()).toBe('confirm');
      });
    });

    describe('reauth path — expired verification', () => {
      it('set step to "reauth" when supportsForceReauth is true but isRecentlyVerified is false', () => {
        verificationService.supportsForceReauth.mockReturnValue(true);
        verificationService.isRecentlyVerified.mockReturnValue(false);

        fixture.detectChanges(); // triggers ngOnInit

        expect(component.step()).toBe('reauth');
      });
    });

    describe('OTP path', () => {
      it('sets step to "otp" when supportsForceReauth returns false', () => {
        verificationService.supportsForceReauth.mockReturnValue(false);

        fixture.detectChanges(); // triggers ngOnInit

        expect(component.step()).toBe('otp');
      });
    });

    // ─── requestOtp ────────────────────────────────────────────────────────────

    describe('requestOtp()', () => {
      beforeEach(() => {
        fixture.detectChanges();
      });

      it('sets otpSent to true and otpSending to false on success', fakeAsync(() => {
        verificationService.requestEmailOtp.mockReturnValue(of(undefined));

        component.requestOtp();
        tick();
        fixture.detectChanges();

        expect(component.otpSent()).toBe(true);
        expect(component.otpSending()).toBe(false);
      }));

      it('sets otpError to true and otpSending to false on error', fakeAsync(() => {
        verificationService.requestEmailOtp.mockReturnValue(throwError(() => new Error('otp failed')));

        component.requestOtp();
        tick();
        fixture.detectChanges();

        expect(component.otpError()).toBe(true);
        expect(component.otpSending()).toBe(false);
      }));
    });

    // ─── delete ────────────────────────────────────────────────────────────────

    describe('delete()', () => {
      beforeEach(() => {
        verificationService.supportsForceReauth.mockReturnValue(false);
        fixture.detectChanges();
      });

      it('calls deleteAccount with the otp code when otpCode is set', fakeAsync(() => {
        component.otpCode.set('123456');

        component.delete();
        tick();

        expect(deleteAccountMock).toHaveBeenCalledWith(mockAccount.slug, '123456');
      }));

      it('sets loading to false on delete error', fakeAsync(() => {
        deleteAccountMock.mockReturnValue(throwError(() => new Error('delete failed')));

        component.delete();
        tick();

        expect(component.loading()).toBe(false);
        expect(TestBed.inject(SisToastService).error).toHaveBeenCalledWith('account.delete.error');
      }));
    });
  });
});
