import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { SDKService } from '@flaps/core';
import { NavigationService } from '../services';

@Injectable({
  providedIn: 'root',
})
export class AccountOwnerGuard implements CanActivate {
  constructor(private navigation: NavigationService, private router: Router, private sdk: SDKService) {}

  canActivate(route: ActivatedRouteSnapshot, routerState: RouterStateSnapshot): Observable<boolean | UrlTree> {
    const slug = routerState.root.firstChild?.firstChild?.paramMap.get('account');
    if (!slug) {
      return of(false);
    } else {
      return this.sdk
        .setCurrentAccount(slug)
        .pipe(
          switchMap((account) =>
            account.can_manage_account
              ? of(true)
              : this.navigation.homeUrl.pipe(map((url) => this.router.createUrlTree([url]))),
          ),
        );
    }
  }
}

@Injectable({
  providedIn: 'root',
})
export class KnowledgeBoxOwnerGuard implements CanActivate {
  constructor(private navigation: NavigationService, private router: Router, private sdk: SDKService) {}

  canActivate(route: ActivatedRouteSnapshot, routerState: RouterStateSnapshot): Observable<boolean | UrlTree> {
    const accountSlug = routerState.root.firstChild?.firstChild?.paramMap.get('account');
    const kbSlug = routerState.root.firstChild?.firstChild?.firstChild?.paramMap.get('stash');
    if (!accountSlug || !kbSlug) {
      return of(false);
    } else {
      return this.sdk
        .setCurrentKnowledgeBox(accountSlug, kbSlug)
        .pipe(
          switchMap((kb) =>
            !!kb.admin ? of(true) : this.navigation.homeUrl.pipe(map((url) => this.router.createUrlTree([url]))),
          ),
        );
    }
  }
}
