import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router, RouterModule } from '@angular/router';
import { BackendConfigurationService, SAMLService, SDKService, SsoService } from '@flaps/core';
import { SisToastService } from '@nuclia/sistema';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { CallbackComponent } from './callback.component';

describe('CallbackComponent', () => {
  let component: CallbackComponent;
  let fixture: ComponentFixture<CallbackComponent>;

  let route: ActivatedRoute;
  let router: { navigate: jest.Mock };
  let samlService: { getToken: jest.Mock };
  let ssoService: { login: jest.Mock; decodeState: jest.Mock };
  let config: { getAPIOrigin: jest.Mock };
  let sdk: {
    nuclia: {
      auth: {
        authenticate: jest.Mock;
        processAuthorizationResponse: jest.Mock;
      };
    };
  };
  let toaster: { error: jest.Mock };

  let snapshotQueryParams: Record<string, any>;
  let snapshotData: Record<string, any>;
  let queryParams$: BehaviorSubject<Record<string, any>>;

  const createComponent = async () => {
    await TestBed.configureTestingModule({
      imports: [RouterModule.forRoot([])],
      providers: [
        { provide: ActivatedRoute, useValue: route },
        { provide: Router, useValue: router },
        { provide: SAMLService, useValue: samlService },
        { provide: SsoService, useValue: ssoService },
        { provide: BackendConfigurationService, useValue: config },
        { provide: SDKService, useValue: sdk },
        { provide: SisToastService, useValue: toaster },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CallbackComponent);
    component = fixture.componentInstance;
  };

  beforeEach(() => {
    snapshotQueryParams = {};
    snapshotData = {};
    queryParams$ = new BehaviorSubject<Record<string, any>>({});

    route = {
      queryParams: queryParams$.asObservable(),
      snapshot: {
        get queryParams() {
          return snapshotQueryParams;
        },
        get data() {
          return snapshotData;
        },
        get queryParamMap() {
          return convertToParamMap(snapshotQueryParams);
        },
      },
    } as unknown as ActivatedRoute;

    router = { navigate: jest.fn() };
    samlService = { getToken: jest.fn(() => of({ access_token: 'saml-access', refresh_token: 'saml-refresh' })) };
    ssoService = {
      login: jest.fn(() => of({ access_token: 'sso-access', refresh_token: 'sso-refresh' })),
      decodeState: jest.fn(() => ({ came_from: undefined })),
    };
    config = {
      getAPIOrigin: jest.fn(() => 'https://api.progress.cloud'),
    };
    sdk = {
      nuclia: {
        auth: {
          authenticate: jest.fn(),
          processAuthorizationResponse: jest.fn(() => of({ success: true, state: {} })),
        },
      },
    };
    toaster = { error: jest.fn() };
    jest.clearAllMocks();
  });

  it('should create', async () => {
    await createComponent();
    expect(component).toBeTruthy();
  });

  it('should handle error query params and navigate to signup', async () => {
    snapshotQueryParams = { error: 'access_denied', error_description: 'denied' };
    await createComponent();

    component.ngOnInit();

    expect(toaster.error).toHaveBeenCalledWith('denied');
    expect(router.navigate).toHaveBeenCalledWith(['/user/signup'], { relativeTo: route });
  });

  it('should call loadUrlToken when token and refresh_token are present', async () => {
    snapshotQueryParams = { token: 'a', refresh_token: 'b' };
    await createComponent();
    const loadUrlTokenSpy = jest.spyOn(component, 'loadUrlToken');

    component.ngOnInit();

    expect(loadUrlTokenSpy).toHaveBeenCalled();
  });

  it('should call handleSAMLCallback when saml flag is present', async () => {
    snapshotData = { saml: true };
    await createComponent();
    const handleSAMLSpy = jest.spyOn(component, 'handleSAMLCallback');

    component.ngOnInit();

    expect(handleSAMLSpy).toHaveBeenCalled();
  });

  it('should call ssoLogin for social login callbacks without token', async () => {
    snapshotData = { google: true };
    snapshotQueryParams = { code: 'code-1', state: 'state-1' };
    await createComponent();
    const ssoLoginSpy = jest.spyOn(component, 'ssoLogin');

    component.ngOnInit();

    expect(ssoLoginSpy).toHaveBeenCalled();
  });

  it('should navigate home when processAuthorizationResponse succeeds without came_from', async () => {
    snapshotQueryParams = { code: 'code-1', state: 'state-1' };
    sdk.nuclia.auth.processAuthorizationResponse.mockReturnValue(of({ success: true, state: {} }));
    await createComponent();

    component.ngOnInit();

    expect(sdk.nuclia.auth.processAuthorizationResponse).toHaveBeenCalledWith('code-1', 'state-1');
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should handle failed processAuthorizationResponse result', async () => {
    snapshotQueryParams = { code: 'code-1', state: 'state-1' };
    sdk.nuclia.auth.processAuthorizationResponse.mockReturnValue(of({ success: false, state: {} }));
    await createComponent();

    component.ngOnInit();

    expect(toaster.error).toHaveBeenCalledWith('login.error.oops');
    expect(router.navigate).toHaveBeenCalledWith(['/user/signup']);
  });

  it('should handle processAuthorizationResponse error', async () => {
    snapshotQueryParams = { code: 'code-1', state: 'state-1' };
    sdk.nuclia.auth.processAuthorizationResponse.mockReturnValue(throwError(() => new Error('oauth error')));
    await createComponent();

    component.ngOnInit();

    expect(toaster.error).toHaveBeenCalledWith('login.error.oops');
    expect(router.navigate).toHaveBeenCalledWith(['/user/signup']);
  });

  it('should navigate to signup when callback params are unsupported', async () => {
    await createComponent();

    component.ngOnInit();

    expect(router.navigate).toHaveBeenCalledWith(['/user/signup'], { relativeTo: route });
  });

  it('should load URL token and authenticate once', async () => {
    await createComponent();
    const authenticateSpy = jest.spyOn(component as any, 'authenticate');
    queryParams$.next({ token: 'url-access', refresh_token: 'url-refresh' });

    component.loadUrlToken();

    expect(authenticateSpy).toHaveBeenCalledWith({ access_token: 'url-access', refresh_token: 'url-refresh' });
  });

  it('should redirect to consent url in handleSAMLCallback', async () => {
    snapshotQueryParams = { consent_url: 'https://oauth.here/consent' };
    await createComponent();

    component.handleSAMLCallback();

    expect(samlService.getToken).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should exchange saml token and authenticate in handleSAMLCallback', async () => {
    snapshotQueryParams = { token: 'saml-token', state: 'state-1' };
    await createComponent();
    const authenticateSpy = jest.spyOn(component as any, 'authenticate');

    component.handleSAMLCallback();

    expect(samlService.getToken).toHaveBeenCalledWith('saml-token');
    expect(authenticateSpy).toHaveBeenCalledWith(
      { access_token: 'saml-access', refresh_token: 'saml-refresh' },
      'state-1',
    );
  });

  it('should handle missing saml callback params', async () => {
    await createComponent();

    component.handleSAMLCallback();

    expect(toaster.error).toHaveBeenCalledWith('login.error.oops');
    expect(router.navigate).toHaveBeenCalledWith(['/user/signup'], { relativeTo: route });
  });

  it('should redirect to consent url for OAuth social flow in ssoLogin', async () => {
    snapshotQueryParams = { code: 'code-1', state: 'state-1' };
    ssoService.decodeState.mockReturnValue({ login_challenge: 'challenge-1', came_from: 'https://app.progress.cloud' });
    ssoService.login.mockReturnValue(of({ consent_url: 'https://oauth.here/consent' }));
    await createComponent();

    component.ssoLogin();

    expect(ssoService.login).toHaveBeenCalledWith('code-1', 'state-1');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should authenticate with tokens for regular social flow in ssoLogin', async () => {
    snapshotQueryParams = { code: 'code-1', state: 'state-1' };
    ssoService.decodeState.mockReturnValue({ came_from: undefined });
    ssoService.login.mockReturnValue(of({ access_token: 'sso-access', refresh_token: 'sso-refresh' }));
    await createComponent();
    const authenticateSpy = jest.spyOn(component as any, 'authenticate');

    component.ssoLogin();

    expect(authenticateSpy).toHaveBeenCalledWith(
      { access_token: 'sso-access', refresh_token: 'sso-refresh' },
      'state-1',
    );
  });

  it('should navigate with invalid_response when sso response is malformed', async () => {
    snapshotQueryParams = { code: 'code-1', state: 'state-1' };
    ssoService.decodeState.mockReturnValue({ came_from: undefined });
    ssoService.login.mockReturnValue(of({}));
    await createComponent();

    component.ssoLogin();

    expect(router.navigate).toHaveBeenCalledWith(['/user/signup'], {
      relativeTo: route,
      queryParams: { error: 'invalid_response' },
    });
  });

  it('should map sso login error status 412 to no_personal_email', async () => {
    snapshotQueryParams = { code: 'code-1', state: 'state-1' };
    ssoService.login.mockReturnValue(throwError(() => ({ status: 412 })));
    await createComponent();

    component.ssoLogin();

    expect(router.navigate).toHaveBeenCalledWith(['/user/signup'], {
      relativeTo: route,
      queryParams: { error: 'no_personal_email' },
    });
  });

  it('should map invalid state error to invalid_configuration and show toast', async () => {
    snapshotQueryParams = { code: 'code-1', state: 'state-1' };
    ssoService.login.mockReturnValue(throwError(() => ({ message: 'Invalid state' })));
    await createComponent();

    component.ssoLogin();

    expect(toaster.error).toHaveBeenCalledWith(
      'Authentication configuration error. Please contact support if this persists.',
    );
    expect(router.navigate).toHaveBeenCalledWith(['/user/signup'], {
      relativeTo: route,
      queryParams: { error: 'invalid_configuration' },
    });
  });

  it('should map unknown sso login errors to oops', async () => {
    snapshotQueryParams = { code: 'code-1', state: 'state-1' };
    ssoService.login.mockReturnValue(throwError(() => ({ status: 500 })));
    await createComponent();

    component.ssoLogin();

    expect(router.navigate).toHaveBeenCalledWith(['/user/signup'], {
      relativeTo: route,
      queryParams: { error: 'oops' },
    });
  });

  it('should do nothing in ssoLogin when code or state are missing', async () => {
    await createComponent();

    component.ssoLogin();

    expect(ssoService.login).not.toHaveBeenCalled();
  });

  it('should authenticate and navigate home when came_from is absent', async () => {
    await createComponent();
    ssoService.decodeState.mockReturnValue({});

    (component as any).authenticate({ access_token: 'a', refresh_token: 'b' }, 'state-1');

    expect(sdk.nuclia.auth.authenticate).toHaveBeenCalledWith({ access_token: 'a', refresh_token: 'b' });
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should validate came_from domains correctly', async () => {
    await createComponent();

    expect((component as any).isCameFromLegit('https://app.progress.cloud/path')).toBe(true);
    expect((component as any).isCameFromLegit('https://evil.example.com/path')).toBe(false);
  });
});
