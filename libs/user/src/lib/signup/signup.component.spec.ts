import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  AnalyticsService,
  BackendConfigurationService,
  FeaturesService,
  LoginService,
  OAuthService,
  SDKService,
  SignupResponse,
  StaticEnvironmentConfiguration,
} from '@flaps/core';
import { PaButtonModule, PaTextFieldModule, PaTranslateModule } from '@guillotinaweb/pastanaga-angular';
import { SisPasswordInputModule } from '@nuclia/sistema';
import { MockComponent, MockModule, MockProvider } from 'ng-mocks';
import { ReCaptchaV3Service } from 'ng-recaptcha-2';
import { BehaviorSubject, of } from 'rxjs';
import { SsoButtonsComponent } from '../sso/sso-buttons.component';
import { UserContainerComponent } from '../user-container';
import { SignupComponent } from './signup.component';

@Component({
  template: '',
})
class MockCheckMailComponent {}

describe('SignupComponent', () => {
  let component: SignupComponent;
  let fixture: ComponentFixture<SignupComponent>;

  let captcha: ReCaptchaV3Service;
  let loginService: LoginService;
  let router: Router;
  let analytics: AnalyticsService;

  const signupData = {
    email: 'bruce@wayne.corp',
    fullname: 'Bruce Wayne',
  };

  const signupResponse = new BehaviorSubject<SignupResponse>({ action: 'check-mail' });

  beforeEach(async () => {
    const originalAppendChild = document.body.appendChild.bind(document.body);

    jest.spyOn(document.body, 'appendChild').mockImplementation((node: Node) => {
      if ((node as Element).tagName === 'SCRIPT') {
        const script = node as HTMLScriptElement;
        script.onload?.(new Event('load'));
        return node;
      }

      return originalAppendChild(node);
    });

    await TestBed.configureTestingModule({
      imports: [
        MockModule(PaTextFieldModule),
        MockModule(PaButtonModule),
        MockModule(PaTranslateModule),
        MockModule(ReactiveFormsModule),
        MockModule(SisPasswordInputModule),
        RouterModule.forRoot([{ path: 'check-mail', component: MockCheckMailComponent }]),
      ],
      declarations: [SignupComponent, MockComponent(UserContainerComponent), MockComponent(SsoButtonsComponent)],
      providers: [
        MockProvider(ReCaptchaV3Service, {
          execute: jest.fn(() => of('some_token')),
        }),
        MockProvider(LoginService, {
          signup: jest.fn(() => signupResponse.asObservable()),
        }),
        MockProvider(OAuthService, {
          getSignUpData: jest.fn(() => signupData),
        }),
        MockProvider(AnalyticsService, {
          logTrialSignup: jest.fn(),
        }),
        {
          provide: SDKService,
          useValue: {
            nuclia: {
              auth: {
                redirectToOAuth: jest.fn(),
              },
            },
          } as unknown as SDKService,
        },
        MockProvider(FeaturesService, {
          unstable: { githubSignin: of(true) },
        } as FeaturesService),
        MockProvider(BackendConfigurationService, {
          getRecaptchaKey: () => 'fake',
          getSocialLogin: () => false,
          staticConf: { client: '' } as StaticEnvironmentConfiguration,
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SignupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('submitForm', () => {
    const data = {
      password: 'Batman = <3',
    };

    beforeEach(() => {
      signupResponse.next({ action: 'check-mail' });
      captcha = TestBed.inject(ReCaptchaV3Service);
      loginService = TestBed.inject(LoginService);
      router = TestBed.inject(Router);
      analytics = TestBed.inject(AnalyticsService);

      router.navigate = jest.fn();
    });

    it('should do nothing when form is not valid', () => {
      expect(component.signupForm.valid).toBe(false);
      component.submitForm();
      expect(captcha.execute).not.toHaveBeenCalled();
    });

    it('should execute captcha and submit the form when valid', () => {
      component.signupForm.setValue(data);
      component.submitForm();
      expect(captcha.execute).toHaveBeenCalledWith('login');
      expect(loginService.signup).toHaveBeenCalledWith(data, 'some_token', undefined);
    });

    it('should navigate to check-mail page on success', () => {
      component.signupForm.setValue(data);
      component.submitForm();
      expect(analytics.logTrialSignup).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(
        ['../check-mail'],
        expect.objectContaining({
          queryParams: { email: signupData.email },
        }),
      );
    });

    it('should display conflict error when signup action is user-exists', () => {
      signupResponse.next({ action: 'user-exists' });
      component.signupForm.setValue(data);
      component.submitForm();
      expect(component.error).toBe('signup.email.already_exists');
    });
  });
});
