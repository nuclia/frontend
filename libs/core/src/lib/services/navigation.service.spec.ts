import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { WINDOW } from '@ng-web-apis/common';
import { MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { AuthService } from '../auth';
import { SDKService } from '../api';
import { BackendConfigurationService } from '../config/backend-config.service';
import { AccountEntryContextService } from '../auth/account-entry-context.service';
import { NavigationService } from './navigation.service';

const STATIC_ENV = { client: 'dashboard' };

describe('NavigationService', () => {
  let router: Router;
  let backendConfig: BackendConfigurationService;
  let fakeWindow: { location: { href: string } };

  function setup(
    overrides: { client?: string } = {},
    entryContextOverride: { returnUrl: string; originClient: string } | null = null,
  ) {
    fakeWindow = { location: { href: 'https://dashboard.stashify.cloud/select' } };
    TestBed.configureTestingModule({
      providers: [
        NavigationService,
        MockProvider(Router, {
          navigate: jest.fn().mockResolvedValue(true),
          navigateByUrl: jest.fn().mockResolvedValue(true),
          createUrlTree: jest.fn().mockReturnValue('URL_TREE' as any),
          events: of() as any,
        }),
        MockProvider(AuthService),
        MockProvider(SDKService, {
          currentAccount: of(null) as any,
          currentKb: of(null) as any,
          arag: of(null) as any,
          nuclia: { options: {} } as any,
          getOriginForApp: jest.fn().mockReturnValue('https://rao.stashify.cloud'),
        } as any),
        MockProvider(AccountEntryContextService, {
          get: jest.fn().mockReturnValue(entryContextOverride),
        }),
        MockProvider(BackendConfigurationService, {
          getAdminOrigin: jest.fn().mockReturnValue(undefined),
        }),
        { provide: WINDOW, useFactory: () => fakeWindow },
        { provide: 'staticEnvironmentConfiguration', useValue: { ...STATIC_ENV, ...overrides } },
      ],
    });
    router = TestBed.inject(Router);
    backendConfig = TestBed.inject(BackendConfigurationService);
    return TestBed.inject(NavigationService);
  }

  // ─── fromApp / inAdminApp ────────────────────────────────────────────────────

  describe('fromApp()', () => {
    it('reflects environment.client directly outside `admin`', () => {
      const service = setup({ client: 'rao' });
      expect(service.fromApp('rao')).toBe(true);
      expect(service.fromApp('dashboard')).toBe(false);
    });

    it('reflects the captured entry-context originClient when in `admin`', () => {
      const service = setup({ client: 'admin' }, { returnUrl: 'https://rao.stashify.cloud', originClient: 'rao' });
      expect(service.fromApp('rao')).toBe(true);
      expect(service.fromApp('dashboard')).toBe(false);
      expect(service.inAdminApp).toBe(true);
    });

    it('defaults to "dashboard" when in `admin` with no captured entry context', () => {
      const service = setup({ client: 'admin' });
      expect(service.fromApp('dashboard')).toBe(true);
    });
  });

  // ─── navigateExternal ────────────────────────────────────────────────────────

  describe('navigateExternal()', () => {
    it('performs a real navigation for an absolute url', () => {
      const service = setup();
      service.navigateExternal('https://admin.stashify.cloud/at/my-account');
      expect(fakeWindow.location.href).toBe('https://admin.stashify.cloud/at/my-account');
    });

    it('appends from/app query params on absolute urls when withFromApp is true', () => {
      const service = setup({ client: 'rao' });
      service.navigateExternal('https://admin.stashify.cloud/at/my-account', { withFromApp: true });
      const url = new URL(fakeWindow.location.href);
      expect(url.searchParams.get('app')).toBe('rao');
      expect(url.searchParams.get('from')).toBeTruthy();
    });

    it('merges explicit queryParams onto absolute urls', () => {
      const service = setup();
      service.navigateExternal('https://admin.stashify.cloud/at/my-account', { queryParams: { setup: 'invite' } });
      const url = new URL(fakeWindow.location.href);
      expect(url.searchParams.get('setup')).toBe('invite');
    });

    it('routes internally via the Angular router for relative urls', () => {
      const service = setup();
      service.navigateExternal('/at/my-account');
      expect(router.navigateByUrl).toHaveBeenCalledWith('/at/my-account');
      expect(fakeWindow.location.href).toBe('https://dashboard.stashify.cloud/select');
    });

    it('uses router.navigate with queryParams for relative urls', () => {
      const service = setup();
      service.navigateExternal('/at/my-account', { queryParams: { tab: 'users' } });
      expect(router.navigate).toHaveBeenCalledWith(['/at/my-account'], { queryParams: { tab: 'users' } });
    });
  });

  // ─── resolveGuardRedirect ────────────────────────────────────────────────────

  describe('resolveGuardRedirect()', () => {
    it('returns false and triggers a real navigation for an absolute url', () => {
      const service = setup();
      const result = service.resolveGuardRedirect('https://admin.stashify.cloud/at/my-account');
      expect(result).toBe(false);
      expect(fakeWindow.location.href).toBe('https://admin.stashify.cloud/at/my-account');
    });

    it('returns a UrlTree for a relative url', () => {
      const service = setup();
      const result = service.resolveGuardRedirect('/at/my-account');
      expect(result).toBe('URL_TREE');
      expect(router.createUrlTree).toHaveBeenCalledWith(['/at/my-account']);
    });

    it('passes queryParams through to createUrlTree for a relative url', () => {
      const service = setup();
      service.resolveGuardRedirect('/at/my-account', { queryParams: { tab: 'users' } });
      expect(router.createUrlTree).toHaveBeenCalledWith(['/at/my-account'], { queryParams: { tab: 'users' } });
    });
  });

  // ─── getAccountManageUrl ─────────────────────────────────────────────────────

  describe('getAccountManageUrl()', () => {
    it('returns a relative in-app url when already in `admin`', () => {
      const service = setup({ client: 'admin' });
      expect(service.getAccountManageUrl('my-account')).toBe('/at/my-account');
    });

    it('computes the admin origin via the SDK when no local override is configured', () => {
      const service = setup({ client: 'dashboard' });
      jest.spyOn(service['sdk'], 'getOriginForApp').mockReturnValue('https://admin.stashify.cloud');
      expect(service.getAccountManageUrl('my-account')).toBe('https://admin.stashify.cloud/at/my-account');
    });

    it('prefers the local-dev adminOrigin override when configured', () => {
      const service = setup({ client: 'dashboard' });
      jest.spyOn(backendConfig, 'getAdminOrigin').mockReturnValue('http://localhost:4300');
      expect(service.getAccountManageUrl('my-account')).toBe('http://localhost:4300/at/my-account');
    });
  });
});
