import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { UserService, StateService, SDKService } from '@flaps/core';
import { map } from 'rxjs';
import { stfAnimations } from '@flaps/pastanaga';

@Component({
  selector: 'da-topbar',
  templateUrl: 'topbar.component.html',
  styleUrls: ['./topbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [stfAnimations],
})
export class TopbarComponent {
  constructor(
    private router: Router,
    private user: UserService,
    private state: StateService,
    private sdk: SDKService,
  ) {}

  menuOpen = false;
  account = this.state.account;

  initials = this.user.userPrefs.pipe(
    map(
      (prefs) =>
        prefs?.name
          ?.split(' ')
          .slice(0, 2)
          .map((word) => word[0])
          .join('')
          .toUpperCase() || '',
    ),
  );

  goHome() {
    this.router.navigate(['/']);
  }

  goSelect() {
    this.router.navigate(['/select']);
  }

  logout() {
    this.sdk.nuclia.auth.logout();
    window.close();
  }
}
