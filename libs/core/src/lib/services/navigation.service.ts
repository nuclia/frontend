import { Inject, Injectable } from '@angular/core';
import { NavigationEnd, Router, UrlTree } from '@angular/router';
import { WINDOW } from '@ng-web-apis/common';
// eslint-disable-next-line @nx/enforce-module-boundaries
import {
  AccountEntryContextService,
  AccountEntryOriginClient,
  AuthService,
  SDKService,
  standaloneSimpleAccount,
  StaticEnvironmentConfiguration,
} from '@flaps/core';
import {
  BehaviorSubject,
  combineLatest,
  defer,
  distinctUntilChanged,
  filter,
  forkJoin,
  map,
  merge,
  Observable,
  of,
  take,
} from 'rxjs';
import { isAbsoluteUrl } from '../utils';
import { BackendConfigurationService } from '../config/backend-config.service';

const IN_ARAG = /at\/[^/]+\/[^/]+\/arag/;

@Injectable({
  providedIn: 'root',
})
export class NavigationService {
  inAdminApp = this.environment.client === 'admin';
  inRaoApp = this.environment.client === 'rao';
  inDashboard = this.environment.client === 'dashboard';

  simpleMode = new BehaviorSubject(false);

  constructor(
    private router: Router,
    private authService: AuthService,
    private sdk: SDKService,
    private entryContext: AccountEntryContextService,
    private backendConfig: BackendConfigurationService,
    @Inject(WINDOW) private window: Window,
    @Inject('staticEnvironmentConfiguration') private environment: StaticEnvironmentConfiguration,
  ) {}

  fromApp(app: AccountEntryOriginClient): boolean {
    return this.resolvedFromApp === app;
  }

  private readonly resolvedFromApp: AccountEntryOriginClient = this.inAdminApp
    ? this.entryContext.get()?.originClient || 'dashboard'
    : (this.environment.client as AccountEntryOriginClient);

  homeUrl: Observable<string> = combineLatest([
    this.sdk.currentAccount,
    this.sdk.currentKb,
    this.sdk.arag,
    this.simpleMode,
  ]).pipe(
    map(([account, kb, arag, simpleMode]) => {
      if (account && this.inAdminApp) {
        return this.getAccountManageUrl(account.slug);
      } else if (account && arag) {
        return this.getRetrievalAgentUrl(account.slug, arag.slug);
      } else if (account && kb) {
        const kbSlug = this.sdk.nuclia.options.standalone ? kb.id : kb.slug;
        const kbUrl = this.getKbUrl(account.slug, kbSlug);
        return simpleMode ? `${kbUrl}/simple` : kbUrl;
      } else if (account) {
        return this.getKbSelectUrl(account.slug);
      } else {
        return '/';
      }
    }),
  );

  kbUrl = combineLatest([this.sdk.currentAccount, this.sdk.currentKb]).pipe(
    map(([account, kb]) => {
      const kbSlug = (this.sdk.nuclia.options.standalone ? kb.id : kb.slug) as string;
      return this.getKbUrl(account.slug, kbSlug);
    }),
  );

  inAragSpace(path: string): boolean {
    return IN_ARAG.test(path);
  }
  inArag() {
    return merge(
      defer(() => of(this.inAragSpace(location.pathname))),
      this.router.events.pipe(
        filter((event) => event instanceof NavigationEnd),
        map((event) => this.inAragSpace((event as NavigationEnd).url)),
      ),
    ).pipe(distinctUntilChanged());
  }
  inKbSettings(path: string, kbUrl: string): boolean {
    // pages common to NucliaDB admin and Dashboard
    const commonPages = ['ai-models', 'entities', 'label-sets', 'manage', 'metrics'];

    if (path.startsWith('#')) {
      const pattern = `/(${commonPages.join('|')})$`;
      return new RegExp(pattern).test(path);
    } else {
      const settingsPages = commonPages.concat(['training', 'users', 'keys', 'rag-lab', 'tasks']);
      const pattern = `${kbUrl}/(${settingsPages.join('|')})`;
      return new RegExp(pattern).test(path);
    }
  }
  inAragSettings(path: string, aragUrl: string): boolean {
    const settingsPages = ['ai-models', 'manage', 'activity', 'users', 'keys', 'rag-lab'];
    const pattern = `${aragUrl}/(${settingsPages.join('|')})`;
    return new RegExp(pattern).test(path);
  }
  inKbUpload(path: string, kbUrl: string): boolean {
    const pattern = `${kbUrl}/upload`;
    return new RegExp(pattern).test(path);
  }

  getAccountUrl(accountSlug: string): string {
    return `/at/${accountSlug}`;
  }

  getRetrievalAgentUrl(accountSlug: string, agentSlug: string): string {
    const path = `/at/${accountSlug}/${this.sdk.nuclia.options.zone}/arag/${agentSlug}`;
    // ARAGs are a `rao` concept — once `admin` hosts this link (no ARAG pages of its own),
    // point at `rao`'s own origin regardless of which app the user entered `admin` from.
    return this.inAdminApp ? `${this.sdk.getOriginForApp('rao')}${path}` : path;
  }

  getPlatformUrl(accountSlug: string): string {
    return `/at/${accountSlug}/platform`;
  }

  getAragSessionsUrl(accountSlug: string, agentSlug: string): string {
    return `${this.getRetrievalAgentUrl(accountSlug, agentSlug)}/sessions`;
  }

  getAragSettingsUrl(accountSlug: string, agentSlug: string): string {
    return `${this.getRetrievalAgentUrl(accountSlug, agentSlug)}/manage`;
  }

  getKbUrl(accountSlug: string, kbSlug: string): string {
    const path = this.sdk.nuclia.options.standalone
      ? `/at/${accountSlug}/${kbSlug}`
      : `/at/${accountSlug}/${this.sdk.nuclia.options.zone}/${kbSlug}`;
    // KBs are a `dashboard`/`rag` concept — once `admin` hosts this link (no KB pages of its
    // own), point at `rag`'s own origin regardless of which app the user entered `admin` from.
    return this.inAdminApp ? `${this.sdk.getOriginForApp('rag')}${path}` : path;
  }

  getResourceListUrl(): Observable<string> {
    return forkJoin([this.sdk.currentAccount.pipe(take(1)), this.sdk.currentKb.pipe(take(1))]).pipe(
      map(([account, kb]) => (kb.slug ? `${this.getKbUrl(account.slug, kb.slug)}/resources` : '')),
    );
  }

  getResourcePreviewUrl(accountSlug: string, kbSlug: string, resourceId: string): string {
    return `${this.getKbUrl(accountSlug, kbSlug)}/resources/${resourceId}/edit/preview`;
  }

  getAccountSelectUrl() {
    return `/select`;
  }

  getKbSelectUrl(accountSlug: string) {
    const path = `/select/${accountSlug}`;
    // In `admin` this is a no-op stub — point to `rag`'s own origin for a real KB picker.
    return this.inAdminApp ? `${this.sdk.getOriginForApp('rag')}${path}` : path;
  }

  getAccountManageUrl(accountSlug: string): string {
    // `admin` mounts `AccountModule` directly at `/at/:account` — no `/manage` segment needed.
    if (this.inAdminApp) return this.getAccountUrl(accountSlug);

    // backendConfig.getAdminOrigin() is for local testing only
    const adminOrigin = this.backendConfig.getAdminOrigin() || this.sdk.getOriginForApp('admin');
    return `${adminOrigin}${this.getAccountUrl(accountSlug)}`;
  }

  /** Navigates to `url`, which may be same-origin (internal route) or cross-origin (a real
   *  `admin` deployment) — absolute URLs get a real navigation; anything else goes through the
   *  Angular router. Pass `withFromApp: true` only when `url` may point back into `admin`, so it
   *  can capture entry context from the appended `from`/`app` query params. */
  navigateExternal(url: string, config?: { queryParams?: Record<string, string>; withFromApp?: boolean }): void {
    const { queryParams, withFromApp } = config || {};
    if (isAbsoluteUrl(url)) {
      const target = new URL(url);
      Object.entries(queryParams || {}).forEach(([key, value]) => target.searchParams.set(key, value));
      if (withFromApp) {
        target.searchParams.set('from', this.window.location.href);
        target.searchParams.set('app', this.environment.client);
      }
      this.window.location.href = target.toString();
    } else if (queryParams) {
      this.router.navigate([url], { queryParams });
    } else {
      this.router.navigateByUrl(url);
    }
  }

  /** `CanActivate` equivalent of `navigateExternal()` — cross-origin `url` triggers the
   *  redirect and blocks activation; same-origin returns a `UrlTree` as usual. */
  resolveGuardRedirect(
    url: string,
    config?: { queryParams?: Record<string, string>; withFromApp?: boolean },
  ): UrlTree | boolean {
    if (isAbsoluteUrl(url)) {
      this.navigateExternal(url, config);
      return false;
    }
    const { queryParams } = config || {};
    return queryParams ? this.router.createUrlTree([url], { queryParams }) : this.router.createUrlTree([url]);
  }

  getKbManageUrl(accountSlug: string, kbSlug: string): string {
    return `${this.getKbUrl(accountSlug, kbSlug)}/manage`;
  }

  getKbCreationUrl(accountSlug: string): string {
    return `${this.getAccountManageUrl(accountSlug)}/kbs/create`;
  }
  getAragCreationUrl(accountSlug: string): string {
    return `${this.getAccountManageUrl(accountSlug)}/arag`;
  }

  getKbUsersUrl(accountSlug: string, kbSlug: string): string {
    return `${this.getKbUrl(accountSlug, kbSlug)}/users`;
  }

  getBillingUrl(accountSlug: string): string {
    return `${this.getAccountManageUrl(accountSlug)}/billing`;
  }

  getUpgradeUrl(accountSlug: string): string {
    return `${this.getBillingUrl(accountSlug)}/subscriptions`;
  }

  getSearchUrl(accountSlug: string, kbSlug: string): string {
    return `${this.getKbUrl(accountSlug, kbSlug)}/search`;
  }
  // Redirect authenticated users to the landing page.
  goToLandingPage(): void {
    const goToUrl = this.authService.getNextUrl();
    if (goToUrl && goToUrl !== '/') {
      this.goToNextUrl(goToUrl);
    } else if (this.environment.standalone) {
      this.router.navigate([this.getKbSelectUrl(standaloneSimpleAccount.slug)]);
    } else {
      this.router.navigate([this.getAccountSelectUrl()]);
    }
  }

  private goToNextUrl(goToUrl: string) {
    let goToParams = null;
    if (this.authService.getNextParams() !== null) {
      goToParams = JSON.parse(this.authService.getNextParams() as string);
    }
    this.authService.setNextParams(null);
    this.authService.setNextUrl(null);
    this.router.navigate([goToUrl], { queryParams: goToParams });
  }

  resetState() {
    this.sdk.cleanAccount();
    this.router.navigate([this.getAccountSelectUrl()]);
  }

  setSimpleMode(value: boolean): void {
    this.simpleMode.next(value);
  }
}
