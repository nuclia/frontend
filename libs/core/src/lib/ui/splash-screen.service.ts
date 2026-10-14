import { DOCUMENT, inject, Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class STFSplashScreenService {
  private readonly _document = inject(DOCUMENT);
  private readonly _router = inject(Router);

  splashScreenEl: HTMLElement | null = null;
  shown: boolean;

  constructor() {
    // Initialize
    this._init();
    this.shown = false;
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Private methods
  // -----------------------------------------------------------------------------------------------------

  private _init(): void {
    // Get the splash screen element
    this.splashScreenEl = this._document.body.querySelector<HTMLElement>('#stf-splash-screen');

    // If the splash screen element exists...
    if (this.splashScreenEl) {
      // Hide it once routing has resolved. `ApplicationRef.isStable` was tried as an extra guard
      // against hiding before the routed view paints, but it isn't a safe signal here: it can stay
      // false indefinitely in apps with ongoing background activity (polling, websockets, etc. inside
      // the zone), which left the splash stuck on-screen forever. Two animation frames after
      // NavigationEnd is enough to let the browser paint the new route before removing the overlay,
      // without depending on the whole app ever going fully idle.
      this._router.events
        .pipe(
          filter((event) => event instanceof NavigationEnd),
          take(1),
        )
        .subscribe(() => {
          requestAnimationFrame(() => requestAnimationFrame(() => this.hide()));
        });
    }
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Public methods
  // -----------------------------------------------------------------------------------------------------

  show(): void {
    this.shown = true;
    this.splashScreenEl?.classList.remove('stf-splash-screen-hidden');
  }

  /**
   * Hide the splash screen
   */
  hide(): void {
    this.shown = false;
    this.splashScreenEl?.classList.add('stf-splash-screen-hidden');
  }
}
