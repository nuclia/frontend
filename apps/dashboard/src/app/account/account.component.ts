import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject } from '@angular/core';
import { WINDOW } from '@ng-web-apis/common';

// Height from which the menu get smaller (prevents scrollbar to appear)
const heightMediaQuery = '(max-height: 730px)';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountComponent {
  smallNavbar: boolean = this.window.matchMedia(heightMediaQuery).matches;
  constructor(@Inject(WINDOW) private window: Window, private cdr: ChangeDetectorRef) {
    this.window.matchMedia(heightMediaQuery).addEventListener('change', (event) => {
      this.smallNavbar = event.matches;
      this.cdr.detectChanges();
    });
  }
}
