import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { SDKService, StateService, UserService } from '@flaps/core';
import { map, Observable } from 'rxjs';
import { AvatarModel } from '@guillotinaweb/pastanaga-angular';
import { SyncService } from '../sync/sync.service';

@Component({
  selector: 'nde-topbar',
  templateUrl: 'topbar.component.html',
  styleUrls: ['./topbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopbarComponent {
  constructor(
    private router: Router,
    private user: UserService,
    private state: StateService,
    private sdk: SDKService,
    private sync: SyncService,
  ) {}

  menuOpen = false;
  account = this.state.account;
  isServerDown = this.sync.isServerDown;

  avatar: Observable<AvatarModel> = this.user.userPrefs.pipe(
    map((pref) => ({
      userName: pref?.name,
      userId: pref?.email,
      size: 'small',
    })),
  );
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

  setSyncServer(reset: boolean) {
    if (reset) {
      this.sync.resetSyncServer();
    }
    this.router.navigate(['/add-upload']);
  }
}
