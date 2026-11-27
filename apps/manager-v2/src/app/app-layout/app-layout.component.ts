import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { BackendConfigurationService, SDKService, UserService } from '@flaps/core';
import { AvatarModel, PaAvatarModule, PaDropdownModule, PaPopupModule } from '@guillotinaweb/pastanaga-angular';
import { SisModalService } from '@nuclia/sistema';
import { TranslatePipe } from '@ngx-translate/core';
import { filter, map, Observable, take } from 'rxjs';
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
  canSeeUsers = this.store.canSeeGlobalUsers;
  canSendEmails = this.store.canSendEmails;
  private backendConfig = inject(BackendConfigurationService);
  assetsPath = this.backendConfig.getAssetsPath();
  brandName = this.backendConfig.getBrandName();

  constructor(
    private userService: UserService,
    private sdk: SDKService,
    private modalService: SisModalService,
  ) {
    this.showDeprecationModal();
  }

  private showDeprecationModal() {
    this.modalService
      .openConfirm({
        title: 'A new version is available',
        description: 'This version is being deprecated. Would you like to switch to the new one now?',
        confirmLabel: 'Go to new',
        cancelLabel: 'Stay here',
      })
      .onClose.pipe(
        take(1),
        filter((confirm) => !!confirm),
      )
      .subscribe(() => window.location.assign(this.sdk.getOriginForApp('manager')));
  }

  logout() {
    this.sdk.nuclia.auth.logout();
  }
}
