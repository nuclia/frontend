import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { BackendConfigurationService, SDKService, UserService } from '@flaps/core';
import { AvatarModel, PaAvatarModule, PaDropdownModule, PaPopupModule } from '@guillotinaweb/pastanaga-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { filter, map, Observable } from 'rxjs';
import { ManagerStore } from '../manager.store';

@Component({
  templateUrl: './app-layout.component.html',
  styleUrls: ['./app-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    RouterLinkActive,
    PaAvatarModule,
    PaPopupModule,
    PaDropdownModule,
    RouterOutlet,
    AsyncPipe,
    TranslatePipe,
  ],
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
    private userService: UserService,
    private sdk: SDKService,
  ) {}

  logout() {
    this.sdk.nuclia.auth.logout();
  }
}
