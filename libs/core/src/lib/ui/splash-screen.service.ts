import { Inject, Injectable, DOCUMENT } from '@angular/core';

import { animate, AnimationBuilder, AnimationPlayer, style } from '@angular/animations';
import { NavigationEnd, Router } from '@angular/router';

import { filter, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class STFSplashScreenService {
  splashScreenEl: any;
  player: AnimationPlayer | undefined;
  shown: boolean;

  constructor(
    private _animationBuilder: AnimationBuilder,
    @Inject(DOCUMENT) private _document: any,
    private _router: Router,
  ) {
    // Initialize
    this._init();
    this.shown = false;
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Private methods
  // -----------------------------------------------------------------------------------------------------

  private _init(): void {
    // Get the splash screen element
    this.splashScreenEl = this._document.body.querySelector('#stf-splash-screen');

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
    this.player = this._animationBuilder
      .build([
        style({
          opacity: '0',
          zIndex: '99999',
        }),
        animate('400ms ease', style({ opacity: '1' })),
      ])
      .create(this.splashScreenEl);

    setTimeout(() => {
      this.player?.onStart(() => (this.splashScreenEl.style.display = 'block'));
      this.player?.play();
    }, 0);
  }

  /**
   * Hide the splash screen
   */
  hide(): void {
    this.shown = false;
    this.player = this._animationBuilder
      .build([
        style({ opacity: '1' }),
        animate(
          '400ms ease',
          style({
            opacity: '0',
            zIndex: '-10',
          }),
        ),
      ])
      .create(this.splashScreenEl);

    setTimeout(() => {
      this.player?.onDone(() => (this.splashScreenEl.style.display = 'none'));
      this.player?.play();
    }, 0);
  }
}
