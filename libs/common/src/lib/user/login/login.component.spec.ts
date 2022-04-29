import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { BackendConfigurationService, GoogleService, OAuthService, SAMLService } from '@flaps/auth';
import { TranslatePipeMock } from '@flaps/core';
import { STFInputModule } from '@flaps/pastanaga';
import { TranslateService } from '@ngx-translate/core';
import { AngularSvgIconModule, SvgIconRegistryService } from 'angular-svg-icon';
import { ReCaptchaV3Service } from 'ngx-captcha';
import { of } from 'rxjs';

import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [LoginComponent, TranslatePipeMock],
        imports: [ReactiveFormsModule, RouterTestingModule, STFInputModule, AngularSvgIconModule],
        providers: [
          { provide: SAMLService, useValue: { checkDomain: () => of() } },
          { provide: OAuthService, useValue: { loginUrl: () => {} } },
          { provide: SvgIconRegistryService, useValue: { loadSvg: () => {} } },
          { provide: GoogleService, useValue: { getGoogleLoginUrl: () => {} } },
          { provide: ReCaptchaV3Service, useValue: { execute: () => {} } },
          {
            provide: BackendConfigurationService,
            useValue: {
              getAPIURL: () => 'key',
              getRecaptchaKey: () => 'key',
              getSAMLLogin: () => {},
              getSocialLogin: () => {},
            },
          },
          {
            provide: TranslateService,
            useValue: { get: () => of('') },
          },
        ],
      }).compileComponents();
    }),
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginComponent);
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
