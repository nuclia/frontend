import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BackendConfigurationService, OAuthService } from '@flaps/core';
import { UserContainerComponent } from '../user-container/user-container.component';
import { UserContainerLogoComponent } from '../user-container/user-container-logo/user-container-logo.component';
import { ConsentComponent } from './consent.component';
import { UserErrorComponent } from '../user-error/user-error.component';
import { MockComponent } from 'ng-mocks';

describe('ConsentComponent', () => {
  let component: ConsentComponent;
  let fixture: ComponentFixture<ConsentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        ConsentComponent,
        UserContainerComponent,
        UserContainerLogoComponent,
        MockComponent(UserErrorComponent),
      ],
      imports: [RouterTestingModule],
      providers: [
        { provide: OAuthService, useValue: { getConsentData: () => {} } },
        {
          provide: BackendConfigurationService,
          useValue: {
            getAPIURL: () => 'key',
            getRecaptchaKey: () => 'key',
            getSAMLLogin: () => {},
            getSocialLogin: () => {},
            getOAuthLogin: () => {},
          },
        },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConsentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  afterEach(() => {
    fixture.destroy();
  });
});
