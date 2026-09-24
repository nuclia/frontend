import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { BackendConfigurationService, SDKService, UserService } from '@flaps/core';
import { PaAvatarModule, PaDropdownModule, PaPopupModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { MockModule, MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { ManagerStore } from '../manager.store';
import { AppLayoutComponent } from './app-layout.component';

describe('AppLayoutComponent', () => {
  let component: AppLayoutComponent;
  let fixture: ComponentFixture<AppLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AppLayoutComponent,
        RouterModule.forRoot([]),
        TranslateModule.forRoot(),
        MockModule(PaAvatarModule),
        MockModule(PaDropdownModule),
        MockModule(PaPopupModule),
      ],
      providers: [
        MockProvider(SDKService, {
          nuclia: {
            auth: {
              getJWTUser: jest.fn(),
            },
          },
        } as unknown as SDKService),
        MockProvider(UserService, { userInfo: of(undefined) }),
        MockProvider(BackendConfigurationService),
        MockProvider(ManagerStore, {
          canUseManager: of(true),
          canManageZones: of(true),
          canSeeUsers: of(true),
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
