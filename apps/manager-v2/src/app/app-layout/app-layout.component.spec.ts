import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { BackendConfigurationService, SDKService, UserService } from '@flaps/core';
import { PaAvatarModule, PaDropdownModule, PaPopupModule } from '@guillotinaweb/pastanaga-angular';
import { SisModalService } from '@nuclia/sistema';
import { MockModule, MockProvider } from 'ng-mocks';
import { of, Subject } from 'rxjs';
import { ManagerStore } from '../manager.store';
import { AppLayoutComponent } from './app-layout.component';

describe('AppLayoutComponent', () => {
  const onClose = new Subject<boolean>();
  const openConfirm = vi.fn();
  const getOriginForApp = vi.fn().mockReturnValue('https://manager.stashify.cloud');
  const assign = vi.fn();
  let component: AppLayoutComponent;
  let fixture: ComponentFixture<AppLayoutComponent>;

  beforeEach(async () => {
    openConfirm.mockReset().mockReturnValue({ onClose });
    vi.stubGlobal('location', { ...window.location, assign });
    await TestBed.configureTestingModule({
      imports: [
        AppLayoutComponent,
        RouterModule.forRoot([]),
        MockModule(PaAvatarModule),
        MockModule(PaDropdownModule),
        MockModule(PaPopupModule),
      ],
      providers: [
        MockProvider(SDKService, {
          getOriginForApp,
          nuclia: {
            auth: {
              getJWTUser: vi.fn(),
            },
          },
        } as unknown as SDKService),
        MockProvider(SisModalService, { openConfirm } as unknown as SisModalService),
        MockProvider(UserService, { userInfo: of(undefined) }),
        MockProvider(BackendConfigurationService),
        MockProvider(ManagerStore, {
          canUseManager: of(true),
          canManageZones: of(true),
          canSeeGlobalUsers: of(true),
          canSendEmails: of(true),
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    assign.mockReset();
  });

  it('should redirect to the new manager when the deprecation modal is confirmed', () => {
    expect(openConfirm).toHaveBeenCalledTimes(1);
    onClose.next(true);
    expect(getOriginForApp).toHaveBeenCalledWith('manager');
    expect(assign).toHaveBeenCalledWith('https://manager.stashify.cloud');
  });

  it('should stay on the current page when the deprecation modal is cancelled', () => {
    onClose.next(false);
    expect(assign).not.toHaveBeenCalled();
  });
});
