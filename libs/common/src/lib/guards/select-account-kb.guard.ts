import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SDKService, SimpleAccount } from '@flaps/core';
import { AccountsKbs, SelectAccountKbService } from '../select-account-kb/select-account-kb.service';
import { NavigationService } from '../services';

@Injectable({
  providedIn: 'root',
})
export class SelectAccountKbGuard implements CanActivate {
  constructor(
    private selectService: SelectAccountKbService,
    private navigation: NavigationService,
    private router: Router,
    private sdk: SDKService,
  ) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> {
    return this.selectService.refresh().pipe(
      map((res) => {
        return this.checkAccounts(res.accounts, res.kbs, route);
      }),
    );
  }

  private checkAccounts(accounts: SimpleAccount[], kbs: AccountsKbs, route: ActivatedRouteSnapshot): boolean | UrlTree {
    // No accounts
    if (accounts.length === 0) {
      return this.router.createUrlTree(['/user/onboarding']);
    }

    if (accounts.length === 1) {
      const accountSlug = accounts[0].slug;
      this.sdk.setCurrentAccount(accountSlug).subscribe();
      const numKbs = kbs[accountSlug].length;

      // One account without kbs
      if (numKbs === 0) {
        return this.router.createUrlTree([this.navigation.getAccountUrl(accountSlug)]);
      }

      // One account with one kb
      else if (numKbs === 1) {
        const stashSlug = kbs[accountSlug][0].slug!;
        return this.router.createUrlTree([this.navigation.getKbUrl(accountSlug, stashSlug)]);
      }

      // One account with multiple kbs
      else {
        if (this.hasInvalidParams(route, accounts)) {
          return this.router.createUrlTree(['/select-account-kb']);
        } else {
          return true;
        }
      }
    }

    if (this.hasInvalidParams(route, accounts)) {
      return this.router.createUrlTree(['/select-account-kb']);
    }
    return true;
  }

  private hasInvalidParams(route: ActivatedRouteSnapshot, accounts: SimpleAccount[]) {
    const accountSlug = route.firstChild?.paramMap.get('account');
    return !!accountSlug && accounts.every((account) => account.slug !== accountSlug);
  }
}
