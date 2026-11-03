import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BackendConfigurationService, SDKService, STFSplashScreenService, UserService } from '@flaps/core';
import { TranslateService as PaTranslateService } from '@guillotinaweb/pastanaga-angular';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  const userPrefs = new Subject<{ language?: string } | undefined>();
  const hasLoggedOut = new Subject<void>();
  const langChange = new Subject<{ lang: string; translations: unknown }>();
  const ngxTranslate = {
    setFallbackLang: vi.fn(),
    use: vi.fn(),
    getBrowserLang: vi.fn(() => 'fr'),
    onLangChange: langChange,
  };
  const paTranslate = { initTranslationsAndUse: vi.fn() };
  const sdk = {
    cleanAccount: vi.fn(),
    nuclia: {
      auth: { hasLoggedOut: () => hasLoggedOut, redirectToOAuth: vi.fn(), authenticate: vi.fn() },
    },
  };

  function render(useRemoteLogin = false) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: UserService, useValue: { userPrefs } },
        { provide: STFSplashScreenService, useValue: {} },
        { provide: BackendConfigurationService, useValue: { useRemoteLogin: () => useRemoteLogin } },
        { provide: PaTranslateService, useValue: paTranslate },
        { provide: TranslateService, useValue: ngxTranslate },
        { provide: SDKService, useValue: sdk },
      ],
    });
    return TestBed.createComponent(AppComponent);
  }

  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, '', '/');
  });

  it('should render the toasts container', async () => {
    const fixture = render();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('aside#pa-toasts-block .pa-toasts-container')).not.toBeNull();
    expect(fixture.componentInstance.toastsContainer).toBeDefined();
  });

  it('should use the browser language when supported, then the user preference once known', async () => {
    const fixture = render();
    await fixture.whenStable();
    expect(ngxTranslate.setFallbackLang).toHaveBeenCalledWith('en');
    expect(ngxTranslate.use).toHaveBeenLastCalledWith('fr');

    userPrefs.next({ language: 'CA' });
    expect(ngxTranslate.use).toHaveBeenLastCalledWith('ca');
  });

  it('should forward language changes to Pastanaga translations', () => {
    render();
    langChange.next({ lang: 'es', translations: { hello: 'hola' } });
    expect(paTranslate.initTranslationsAndUse).toHaveBeenCalledWith('es', { hello: 'hola' });
  });

  it('should redirect to OAuth and clean the account when the user logs out', () => {
    render();
    hasLoggedOut.next();
    expect(sdk.nuclia.auth.redirectToOAuth).toHaveBeenCalled();
    expect(sdk.cleanAccount).toHaveBeenCalled();
  });

  it('should authenticate with the tokens from the URL when remote login is enabled', () => {
    window.history.replaceState({}, '', '/?access_token=abc&refresh_token=def');
    render(true);
    expect(sdk.nuclia.auth.authenticate).toHaveBeenCalledWith({ access_token: 'abc', refresh_token: 'def' });
  });

  it('should not authenticate from the URL when remote login is disabled', () => {
    window.history.replaceState({}, '', '/?access_token=abc');
    render(false);
    expect(sdk.nuclia.auth.authenticate).not.toHaveBeenCalled();
  });

  it('should stop preventing file drops once destroyed', async () => {
    const fixture = render();
    await fixture.whenStable();
    const dropWhileAlive = new Event('drop', { cancelable: true });
    window.dispatchEvent(dropWhileAlive);
    expect(dropWhileAlive.defaultPrevented).toBe(true);

    fixture.destroy();
    const dropAfterDestroy = new Event('drop', { cancelable: true });
    window.dispatchEvent(dropAfterDestroy);
    expect(dropAfterDestroy.defaultPrevented).toBe(false);
  });
});
