import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { BackendConfigurationService, SDKService, UserService } from '@flaps/core';
import { MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { ManagerStore } from '../manager.store';
import { AppLayoutComponent } from './app-layout.component';

describe('AppLayoutComponent', () => {
  let component: AppLayoutComponent;
  let fixture: ComponentFixture<AppLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppLayoutComponent, RouterModule.forRoot([])],
      providers: [
        MockProvider(SDKService, {
          nuclia: {
            auth: {
              getJWTUser: vi.fn(),
            },
          },
        } as unknown as SDKService),
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
});
