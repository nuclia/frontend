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
  last: string;

  constructor(
    private _animationBuilder: AnimationBuilder,
    @Inject(DOCUMENT) private _document: any,
    private _router: Router,
  ) {
    // Initialize
    this._init();
    this.last = 'Be patient my friend ' + String.fromCodePoint(128513);
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
      // Hide it on the first NavigationEnd event
      this._router.events
        .pipe(
          filter((event) => event instanceof NavigationEnd),
          take(1),
        )
        .subscribe(() => {
          setTimeout(() => {
            this.hide();
          });
        });
    }
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Public methods
  // -----------------------------------------------------------------------------------------------------

  show(text?: string, emoji?: number): void {
    if (text) {
      this.last = this.splashScreenEl.querySelector('#stf-splash-screen-text').textContent;
      if (emoji) {
        text = text + ' ' + String.fromCodePoint(emoji);
      }
      this.splashScreenEl.querySelector('#stf-splash-screen-text').innerText = text;
    } else {
      this.splashScreenEl.querySelector('#stf-splash-screen-text').innerText = this.last;
    }
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
