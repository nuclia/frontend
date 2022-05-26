import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, StateService } from '@flaps/auth';
import { Observable, combineLatest, map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NavigationService {
  constructor(private stateService: StateService, private router: Router, private authService: AuthService) {}

  homeUrl: Observable<string> = combineLatest([
    this.stateService.account,
    this.stateService.stash
  ]).pipe(map(([account, kb]) => {
    if (account && kb) {
      return this.getKbUrl(account.slug, kb.slug!);
    } else if (account) {
      return this.getKbSelectUrl(account.slug);
    } else {
      return '/';
    }
  }));

  getAccountUrl(accountSlug: string): string {
    return `/at/${accountSlug}`;
  }

  getKbUrl(accountSlug: string, kbSlug: string): string {
    return `/at/${accountSlug}/${kbSlug}`;
  }

  getAccountSelectUrl() {
    return `/select`;
  }

  getKbSelectUrl(accountSlug: string) {
    return `/select/${accountSlug}`;
  }

  getAccountMangeUrl(accountSlug: string): string {
    return `${this.getAccountUrl(accountSlug)}/manage`;
  }

  getKbMangeUrl(accountSlug: string, kbSlug: string): string {
    return `${this.getKbUrl(accountSlug, kbSlug)}/manage`;
  }

  getKbUsersUrl(accountSlug: string, kbSlug: string): string {
    return `${this.getKbUrl(accountSlug, kbSlug)}/users`;
  }

  getSearchUrl(accountSlug: string, kbSlug: string): string {
    return `${this.getKbUrl(accountSlug, kbSlug)}/search`;
  }
  // Redirect authentificated users to the landing page.
  goToLandingPage(): void {
    const data = this.stateService.dbGetStateData();
    const goToUrl = this.authService.getNextUrl();
    if (goToUrl && goToUrl !== '/') {
      this.goToNextUrl(goToUrl);
    } else if (!!data && data.account) {
      this.router.navigate([this.getKbSelectUrl(data.account)]);
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
    this.stateService.dbDelStateData();
    this.stateService.cleanAccount();
    this.router.navigate([this.getAccountSelectUrl()]);
  }
}
