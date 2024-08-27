import { Inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, SDKService, standaloneSimpleAccount, StaticEnvironmentConfiguration } from '@flaps/core';
import { combineLatest, forkJoin, map, Observable, take } from 'rxjs';

const IN_ACCOUNT_MANAGEMENT = new RegExp('/at/[^/]+/manage');
const IN_ACCOUNT_BILLING = new RegExp('/at/[^/]+/manage/billing');

@Injectable({
  providedIn: 'root',
})
export class NavigationService {
  constructor(
    private router: Router,
    private authService: AuthService,
    private sdk: SDKService,
    @Inject('staticEnvironmentConfiguration') private environment: StaticEnvironmentConfiguration,
  ) {}

  homeUrl: Observable<string> = combineLatest([this.sdk.currentAccount, this.sdk.currentKb]).pipe(
    map(([account, kb]) => {
      if (account && this.inAccountManagement(location.pathname)) {
        return this.getAccountManageUrl(account.slug);
      } else if (account && kb) {
        const kbSlug = this.sdk.nuclia.options.standalone ? kb.id : kb.slug;
        return this.getKbUrl(account.slug, kbSlug);
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

  inAccountManagement(path: string): boolean {
    return path.match(IN_ACCOUNT_MANAGEMENT) !== null;
  }
  inKbSettings(path: string, kbUrl: string): boolean {
    // pages common to NucliaDB admin and Dashboard
    const commonPages = ['ai-models', 'entities', 'label-sets', 'manage', 'metrics'];

    if (path.startsWith('#')) {
      const pattern = `/(${commonPages.join('|')})$`;
      return path.match(new RegExp(pattern)) !== null;
    } else {
      const settingsPages = commonPages.concat([
        'activity',
        'synonyms',
        'training',
        'users',
        'keys',
        'prompt-lab',
        'tasks',
      ]);
      const pattern = `${kbUrl}/(${settingsPages.join('|')})`;
      return path.match(new RegExp(pattern)) !== null;
    }
  }
  inKbUpload(path: string, kbUrl: string): boolean {
    const pattern = `${kbUrl}/upload`;
    return path.match(new RegExp(pattern)) !== null;
  }
  inAccountBilling(path: string): boolean {
    return path.match(IN_ACCOUNT_BILLING) !== null;
  }

  getAccountUrl(accountSlug: string): string {
    return `/at/${accountSlug}`;
  }

  getKbUrl(accountSlug: string, kbSlug: string): string {
    return this.sdk.nuclia.options.standalone
      ? `/at/${accountSlug}/${kbSlug}`
      : `/at/${accountSlug}/${this.sdk.nuclia.options.zone}/${kbSlug}`;
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
    return `/select/${accountSlug}`;
  }

  getAccountManageUrl(accountSlug: string): string {
    return `${this.getAccountUrl(accountSlug)}/manage`;
  }

  getKbManageUrl(accountSlug: string, kbSlug: string): string {
    return `${this.getKbUrl(accountSlug, kbSlug)}/manage`;
  }

  getKbCreationUrl(accountSlug: string): string {
    return `${this.getAccountUrl(accountSlug)}/manage/kbs/create`;
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
}
