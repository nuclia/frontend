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
    nuclia: { auth: { hasLoggedOut: () => hasLoggedOut, redirectToOAuth: vi.fn() } },
  };

  function render(version = '1.2.3') {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: UserService, useValue: { userPrefs } },
        { provide: STFSplashScreenService, useValue: {} },
        { provide: BackendConfigurationService, useValue: { getVersion: () => version } },
        { provide: PaTranslateService, useValue: paTranslate },
        { provide: TranslateService, useValue: ngxTranslate },
        { provide: SDKService, useValue: sdk },
      ],
    });
    const fixture = TestBed.createComponent(AppComponent);
    return fixture;
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the app version and the toasts container', async () => {
    const fixture = render('1.2.3');
    await fixture.whenStable();

    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('.version')?.textContent).toBe('Version: 1.2.3');
    expect(element.querySelector('aside#pa-toasts-block .pa-toasts-container')).not.toBeNull();
    expect(fixture.componentInstance.toastsContainer).toBeDefined();
  });

  it('should use the browser language when supported, then the user preference once known', async () => {
    const fixture = render();
    await fixture.whenStable();
    expect(ngxTranslate.setFallbackLang).toHaveBeenCalledWith('en');
    expect(ngxTranslate.use).toHaveBeenLastCalledWith('fr');

    userPrefs.next({ language: 'ES' });
    expect(ngxTranslate.use).toHaveBeenLastCalledWith('es');
  });

  it('should fall back to english when the browser language is not supported', () => {
    ngxTranslate.getBrowserLang.mockReturnValueOnce('de');
    render();
    expect(ngxTranslate.use).toHaveBeenLastCalledWith('en');
  });

  it('should forward language changes to Pastanaga translations', () => {
    render();
    langChange.next({ lang: 'ca', translations: { hello: 'hola' } });
    expect(paTranslate.initTranslationsAndUse).toHaveBeenCalledWith('ca', { hello: 'hola' });
  });

  it('should clean the account and redirect to OAuth when the user logs out', () => {
    render();
    hasLoggedOut.next();
    expect(sdk.cleanAccount).toHaveBeenCalled();
    expect(sdk.nuclia.auth.redirectToOAuth).toHaveBeenCalled();
  });

  it('should prevent file drops from navigating away until it is destroyed', async () => {
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
