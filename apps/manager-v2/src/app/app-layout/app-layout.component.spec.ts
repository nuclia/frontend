import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppLayoutComponent } from './app-layout.component';
import { RouterTestingModule } from '@angular/router/testing';
import { BackendConfigurationService, SDKService, UserService } from '@flaps/core';
import { MockModule, MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { PaAvatarModule, PaDropdownModule, PaPopupModule } from '@guillotinaweb/pastanaga-angular';

describe('AppLayoutComponent', () => {
  let component: AppLayoutComponent;
  let fixture: ComponentFixture<AppLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        MockModule(TranslateModule),
        MockModule(PaAvatarModule),
        MockModule(PaDropdownModule),
        MockModule(PaPopupModule),
      ],
      declarations: [AppLayoutComponent],
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
