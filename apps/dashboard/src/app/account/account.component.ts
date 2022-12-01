import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy } from '@angular/core';
import { WINDOW } from '@ng-web-apis/common';

// Height from which the menu get smaller (prevents scrollbar to appear)
const heightMediaQuery = '(max-height: 730px)';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountComponent implements OnDestroy {
  smallNavbar: boolean = this.window.matchMedia(heightMediaQuery).matches;
  private mediaQueryList;

  constructor(@Inject(WINDOW) private window: Window, private cdr: ChangeDetectorRef) {
    this.mediaQueryList = this.window.matchMedia(heightMediaQuery);
    this.mediaQueryList.addEventListener('change', this.onMatchMediaChange);
  }

  ngOnDestroy() {
    this.mediaQueryList.removeEventListener('change', this.onMatchMediaChange);
  }

  private onMatchMediaChange(event: MediaQueryListEvent) {
    this.smallNavbar = event.matches;
    this.cdr.detectChanges();
  }
}
