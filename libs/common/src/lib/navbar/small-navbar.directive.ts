import { ChangeDetectorRef, Directive, inject } from '@angular/core';
import { WINDOW } from '@ng-web-apis/common';

// Height from which the menu get smaller (prevents scrollbar to appear)
export const heightMediaQuery = '(max-height: 856px)';

@Directive({
  selector: '[appSmallNavbar]',
  standalone: false,
})
export class SmallNavbarDirective {
  private mediaQueryList;

  window: Window;
  cdr: ChangeDetectorRef;
  smallNavbar: boolean;

  constructor() {
    this.window = inject(WINDOW);
    this.cdr = inject(ChangeDetectorRef);
    this.smallNavbar = this.window.matchMedia(heightMediaQuery).matches;

    this.mediaQueryList = this.window.matchMedia(heightMediaQuery);
    this.mediaQueryList.addEventListener('change', this.onMatchMediaChange.bind(this));
  }

  ngOnDestroy() {
    this.mediaQueryList.removeEventListener('change', this.onMatchMediaChange.bind(this));
  }

  private onMatchMediaChange(event: MediaQueryListEvent) {
    this.smallNavbar = event.matches;
    this.cdr.detectChanges();
  }
}
