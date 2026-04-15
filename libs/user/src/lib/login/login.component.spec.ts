import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BackendConfigurationService, OAuthService, SAMLService, OAuthLoginData, FeaturesService } from '@flaps/core';
import { MockModule } from 'ng-mocks';
import { ReCaptchaV3Service } from 'ng-recaptcha-2';
import { BehaviorSubject, firstValueFrom, of, throwError } from 'rxjs';
import { PaTranslateModule } from '@guillotinaweb/pastanaga-angular';

import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  let router: { navigate: jest.Mock };
  let oAuthService: { getCameFrom: jest.Mock; loginUrl: jest.Mock };
  let config: {
    useRemoteLogin: jest.Mock;
    getRecaptchaKey: jest.Mock;
    getAPIOrigin: jest.Mock;
    getSocialLogin: jest.Mock;
  };
  let reCaptchaV3Service: { execute: jest.Mock };
  let samlService: { checkDomain: jest.Mock; ssoUrl: jest.Mock };
  const featuresService = { unstable: { progressComSignup: of(false) } };

  let routeData$: BehaviorSubject<{ loginData: OAuthLoginData }>;
  let routeQueryParams$: BehaviorSubject<Record<string, string | undefined>>;

  const buildComponent = async () => {
    await TestBed.configureTestingModule({
      declarations: [LoginComponent],
      imports: [ReactiveFormsModule, MockModule(PaTranslateModule)],
      providers: [
        { provide: OAuthService, useValue: oAuthService },
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: {
            data: routeData$.asObservable(),
            queryParams: routeQueryParams$.asObservable(),
            snapshot: {
              data: {
                loginData: routeData$.value.loginData,
              },
            },
          },
        },
        { provide: ReCaptchaV3Service, useValue: reCaptchaV3Service },
        { provide: BackendConfigurationService, useValue: config },
        { provide: SAMLService, useValue: samlService },
        { provide: FeaturesService, useValue: featuresService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(LoginComponent, {
        set: {
          template: '',
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  beforeEach(() => {
    router = {
      navigate: jest.fn(),
    };
    oAuthService = {
      getCameFrom: jest.fn(() => 'http://app.local'),
      loginUrl: jest.fn(() => 'http://oauth.here/login'),
    };
    config = {
      useRemoteLogin: jest.fn(() => false),
      getRecaptchaKey: jest.fn(() => 'captcha-key'),
      getAPIOrigin: jest.fn(() => 'http://api.local'),
      getSocialLogin: jest.fn(() => false),
    };
    reCaptchaV3Service = {
      execute: jest.fn(() => of('captcha-token')),
    };
    samlService = {
      checkDomain: jest.fn(() => of({ account_id: 'acc-1' })),
      ssoUrl: jest.fn((accountId: string, challenge?: string) => `https://sso.local/${accountId}?c=${challenge || ''}`),
    };

    routeData$ = new BehaviorSubject<{ loginData: OAuthLoginData }>({
      loginData: { needs_initial_setpassword: false } as OAuthLoginData,
    });
    routeQueryParams$ = new BehaviorSubject<Record<string, string | undefined>>({
      message: 'hello',
      login_challenge: 'challenge-1',
    });
  });

  it('should create', async () => {
    await buildComponent();
    expect(component).toBeTruthy();
  });

  it('should build signUpUrl from cameFrom', async () => {
    await buildComponent();
    expect(component.signUpUrl).toBe('http://app.local/user/signup');
  });

  it('should navigate to recover page when initial password is required', async () => {
    routeData$.next({ loginData: { needs_initial_setpassword: true } as OAuthLoginData });
    await buildComponent();

    expect(router.navigate).toHaveBeenCalledWith(['/user/recover'], {
      queryParamsHandling: 'merge',
      queryParams: { isPasswordInit: true },
    });
  });

  it('should set message and loginChallenge from query params', async () => {
    await buildComponent();

    expect(component.message).toBe('hello');
    expect(component.loginChallenge).toBe('challenge-1');
    expect(component.error).toBeNull();
  });

  it('should set unknown challenge error when login_challenge is missing', async () => {
    routeQueryParams$.next({ message: 'msg' });
    await buildComponent();

    expect(component.error).toBe('login.error.unknown_login_challenge');
  });

  it('should set message from OAuth error description when error exists', async () => {
    routeQueryParams$.next({
      error: 'access_denied',
      error_description: 'denied by policy',
      login_challenge: 'challenge-1',
    });
    await buildComponent();

    expect(component.message).toBe('denied by policy');
  });

  it('should set fallback message when OAuth error description is missing', async () => {
    routeQueryParams$.next({
      error: 'invalid_request',
      login_challenge: 'challenge-1',
    });
    await buildComponent();

    expect(component.message).toBe('login.error.invalid_request');
  });

  it('should trigger remoteLogin when remote login is enabled', async () => {
    const remoteLoginSpy = jest.spyOn(LoginComponent.prototype as never, 'remoteLogin' as never);
    config.useRemoteLogin.mockReturnValue(true);

    await buildComponent();

    expect(remoteLoginSpy).toHaveBeenCalled();
    remoteLoginSpy.mockRestore();
  });

  it('should set password focus on enter pressed from email field', async () => {
    await buildComponent();

    component.password = { hasFocus: false } as any;
    component.onEnterPressed('email');

    expect(component.password?.hasFocus).toBe(true);
  });

  it('should ignore enter pressed from non-email field', async () => {
    await buildComponent();

    component.password = { hasFocus: false } as any;
    component.onEnterPressed('password');

    expect(component.password?.hasFocus).toBe(false);
  });

  it('should return OAuth login URL', async () => {
    await buildComponent();
    expect(component.oAuthLoginUrl()).toBe('http://oauth.here/login');
  });

  it('should do nothing in login when form is invalid', async () => {
    await buildComponent();

    const oauthLoginSpy = jest.spyOn(component, 'oAuthLogin');
    component.loginForm.setValue({ email: '', password: '' });
    component.login();

    expect(oauthLoginSpy).not.toHaveBeenCalled();
    expect(reCaptchaV3Service.execute).not.toHaveBeenCalled();
    expect(component.isLoggingIn).toBe(false);
  });

  it('should execute captcha and then OAuth login when recaptcha key exists', async () => {
    await buildComponent();

    const oauthLoginSpy = jest.spyOn(component, 'oAuthLogin');
    component.loginForm.setValue({ email: 'bruce@wayne.corp', password: 'batman' });
    component.login();

    expect(component.isLoggingIn).toBe(true);
    expect(reCaptchaV3Service.execute).toHaveBeenCalledWith('login');
    expect(oauthLoginSpy).toHaveBeenCalled();
  });

  it('should call OAuth login directly when recaptcha is disabled', async () => {
    config.getRecaptchaKey.mockReturnValue('');
    await buildComponent();

    const oauthLoginSpy = jest.spyOn(component, 'oAuthLogin');
    component.loginForm.setValue({ email: 'bruce@wayne.corp', password: 'batman' });
    component.login();

    expect(reCaptchaV3Service.execute).not.toHaveBeenCalled();
    expect(oauthLoginSpy).toHaveBeenCalled();
  });

  it('should submit form in oAuthLogin when form is valid', async () => {
    await buildComponent();

    const submit = jest.fn();
    component.form = { nativeElement: { submit } } as any;
    component.loginForm.setValue({ email: 'bruce@wayne.corp', password: 'batman' });

    component.oAuthLogin();

    expect(submit).toHaveBeenCalled();
  });

  it('should not submit form in oAuthLogin when form is invalid', async () => {
    await buildComponent();

    const submit = jest.fn();
    component.form = { nativeElement: { submit } } as any;
    component.loginForm.setValue({ email: '', password: '' });

    component.oAuthLogin();

    expect(submit).not.toHaveBeenCalled();
  });

  it('should emit SSO URL when domain is valid', async () => {
    await buildComponent();

    const ssoPromise = firstValueFrom(component.ssoUrl);
    component.loginForm.controls.email.setValue('bruce@wayne.corp');

    await expect(ssoPromise).resolves.toBe('https://sso.local/acc-1?c=challenge-1');
    expect(samlService.checkDomain).toHaveBeenCalledWith('wayne.corp');
    expect(samlService.ssoUrl).toHaveBeenCalledWith('acc-1', 'challenge-1');
  });

  it('should emit undefined for email without domain', async () => {
    await buildComponent();

    const ssoPromise = firstValueFrom(component.ssoUrl);
    component.loginForm.controls.email.setValue('bruce');

    await expect(ssoPromise).resolves.toBeUndefined();
    expect(samlService.checkDomain).not.toHaveBeenCalled();
  });

  it('should emit undefined when checkDomain fails', async () => {
    samlService.checkDomain.mockReturnValue(throwError(() => new Error('network')));
    await buildComponent();

    const ssoPromise = firstValueFrom(component.ssoUrl);
    component.loginForm.controls.email.setValue('bruce@wayne.corp');

    await expect(ssoPromise).resolves.toBeUndefined();
  });

  it('should pre-fill email and set account_already_exists message when loginData has email and needs_signup is false', async () => {
    routeData$.next({
      loginData: {
        skip_login: false,
        needs_signup: false,
        email: 'test@example.com',
      } as OAuthLoginData,
    });
    routeQueryParams$.next({ login_challenge: 'challenge-1' });

    await buildComponent();

    expect(component.emailControl.value).toBe('test@example.com');
    expect(component.message).toBe('login.account_already_exists');
  });

  it('should not pre-fill email and not set account_already_exists message when needs_signup is true', async () => {
    routeData$.next({
      loginData: {
        skip_login: false,
        needs_signup: true,
        email: 'test@example.com',
      } as OAuthLoginData,
    });
    routeQueryParams$.next({ login_challenge: 'challenge-1' });

    await buildComponent();

    expect(component.emailControl.value).toBe('');
    expect(component.message).not.toBe('login.account_already_exists');
  });
});
