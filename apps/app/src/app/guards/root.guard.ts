import { Injectable } from '@angular/core';
import { Router, ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot, UrlTree } from '@angular/router';
import { NavigationService } from '../services/navigation.service';

@Injectable({
  providedIn: 'root'
})
export class RootGuard implements CanActivate {

  constructor (private navigation: NavigationService) {}

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    this.navigation.goToLandingPage();
    return false;
  }
}
