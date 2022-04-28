import {
  ActivatedRouteSnapshot,
  CanActivate,
  CanActivateChild,
  CanLoad,
  Route,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { Injectable } from '@angular/core';
import { UserService } from './user.service';
import { AuthService } from './auth.service';
import { SDKService } from './sdk.service';

@Injectable({
  providedIn: 'root',
})
export class LoggedinGuard implements CanActivate, CanActivateChild, CanLoad {
  constructor(
    public user: UserService,
    private authService: AuthService,
    private router: Router,
    private sdk: SDKService,
  ) {}

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const url: string = state.url;

    return this.checkLogin(url, next.queryParams);
  }

  canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    return this.canActivate(route, state);
  }

  canLoad(route: Route): boolean {
    const url = `/${route.path}`;
    return this.checkLogin(url);
  }

  checkLogin(url: string, params?: any): boolean {
    if (this.sdk.nuclia.auth.getToken() || this.routeHasMagicToken()) {
      return true;
    }
    // Store the attempted URL for redirecting
    this.authService.setNextParams(params);
    this.authService.setNextUrl(url);

    // Navigate to the login page with extras
    this.router.navigate(['/user/login']);
    return false;
  }

  private routeHasMagicToken(): boolean {
    return window.location.search.indexOf('token=') > -1;
  }
}
