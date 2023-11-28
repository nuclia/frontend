import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { SDKService, UserService } from '@flaps/core';
import { map, Observable } from 'rxjs';
import { AvatarModel } from '@guillotinaweb/pastanaga-angular';
import { SyncService } from '../sync/sync.service';

@Component({
  selector: 'nsy-topbar',
  templateUrl: 'topbar.component.html',
  styleUrls: ['./topbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopbarComponent {
  constructor(
    private router: Router,
    private user: UserService,
    private sdk: SDKService,
    private sync: SyncService,
  ) {}

  menuOpen = false;
  account$ = this.sdk.currentAccount;
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

  goSelect() {
    this.router.navigate(['/select']);
  }

  logout() {
    this.sync.logout();
    window.close();
  }
}