import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { filter, map, Observable } from 'rxjs';
import { AvatarModel } from '@guillotinaweb/pastanaga-angular';
import { BackendConfigurationService, SDKService, UserService } from '@flaps/core';
import { Router } from '@angular/router';
import { ManagerStore } from '../manager.store';

@Component({
  templateUrl: './app-layout.component.html',
  styleUrls: ['./app-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class AppLayoutComponent {
  userInfo = this.userService.userInfo;
  avatar: Observable<AvatarModel> = this.userInfo.pipe(
    filter((userInfo) => !!userInfo),
    map((userInfo) => ({
      userName: userInfo?.preferences.name || '–',
      userId: userInfo?.preferences.email,
    })),
  );
  private store = inject(ManagerStore);
  canUseManager = this.store.canUseManager;
  canManageZones = this.store.canManageZones;
  canSeeUsers = this.store.canSeeUsers;
  private backendConfig = inject(BackendConfigurationService);
  assetsPath = this.backendConfig.getAssetsPath();
  brandName = this.backendConfig.getBrandName();

  constructor(
    private router: Router,
    private userService: UserService,
    private sdk: SDKService,
  ) {}

  logout() {
    this.router.navigate(['/user/logout']);
  }
}
