import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { SDKService, UserService } from '@flaps/auth';
import { map, of, switchMap } from 'rxjs';
import { stfAnimations } from '@flaps/pastanaga';
import { SyncService } from '../sync/sync.service';


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
    private sync: SyncService,
    private sdk: SDKService,
  ) {}

  menuOpen = false;

  account = of(this.sync.getAccount()).pipe(
    switchMap((account) => this.sdk.setCurrentAccount(account)),
  );

  initials = this.user.userPrefs.pipe(
    map((prefs) => prefs?.name?.split(' ').slice(0,2).map((word) => word[0]).join('').toUpperCase() || '')
  );

  goHome() {
    this.router.navigate(['/']);
  }

  goSelect() {
    this.router.navigate(['/select']);
  }

  logout() {
    this.router.navigate(['/user/logout']);
  }

}
