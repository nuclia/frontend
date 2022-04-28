import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { NavigationService } from '../services/navigation.service';
import { SDKService } from '@flaps/auth';

@Injectable({
  providedIn: 'root',
})
export class AccountOwnerGuard implements CanActivate {
  constructor(private navigation: NavigationService, private router: Router, private sdk: SDKService) {}

  canActivate(route: ActivatedRouteSnapshot, routerState: RouterStateSnapshot): Observable<boolean> {
    const slug = routerState.root.firstChild?.firstChild?.paramMap.get('account');
    if (!slug) {
      return of(false);
    } else {
      return this.sdk.setCurrentAccount(slug).pipe(
        map((account) => account.can_manage_account),
        tap((canManage) => {
          if (!canManage) {
            this.router.navigate([this.navigation.getHomeUrl()]);
          }
        }),
      );
    }
  }
}

@Injectable({
  providedIn: 'root',
})
export class KnowledgeBoxOwnerGuard implements CanActivate {
  constructor(private navigation: NavigationService, private router: Router, private sdk: SDKService) {}

  canActivate(route: ActivatedRouteSnapshot, routerState: RouterStateSnapshot): Observable<boolean> {
    const accountSlug = routerState.root.firstChild?.firstChild?.paramMap.get('account');
    const kbSlug = routerState.root.firstChild?.firstChild?.firstChild?.paramMap.get('stash');
    if (!accountSlug || !kbSlug) {
      return of(false);
    } else {
      return this.sdk.setCurrentKnowledgeBox(accountSlug, kbSlug).pipe(
        map((kb) => !!kb.admin),
        tap((canManage) => {
          if (!canManage) {
            this.router.navigate([this.navigation.getHomeUrl()]);
          }
        }),
      );
    }
  }
}
