import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { BackendConfigurationService, SDKService, UserService } from '@flaps/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { matLogoutRound } from '@ng-icons/material-icons/round';
import { TranslatePipe } from '@ngx-translate/core';
import { HlmAvatarImports } from '@nuclia/ui-spartan/avatar';
import { HlmDropdownMenuImports } from '@nuclia/ui-spartan/dropdown-menu';
import { ManagerStore } from '../manager.store';

@Component({
  templateUrl: './app-layout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    TranslatePipe,
    HlmAvatarImports,
    HlmDropdownMenuImports,
    NgIcon,
  ],
  providers: [provideIcons({ matLogoutRound })],
})
export class AppLayoutComponent {
  private sdk = inject(SDKService);
  private store = inject(ManagerStore);
  private backendConfig = inject(BackendConfigurationService);

  private userInfo = toSignal(inject(UserService).userInfo);
  protected readonly userName = computed(() => this.userInfo()?.preferences.name || '–');
  protected readonly userEmail = computed(() => this.userInfo()?.preferences.email);
  protected readonly initials = computed(() =>
    this.userName()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join(''),
  );

  protected readonly canUseManager = toSignal(this.store.canUseManager);
  protected readonly canManageZones = toSignal(this.store.canManageZones);
  protected readonly canSeeUsers = toSignal(this.store.canSeeGlobalUsers);
  protected readonly canSendEmails = toSignal(this.store.canSendEmails);
  protected readonly assetsPath = this.backendConfig.getAssetsPath();
  protected readonly brandName = this.backendConfig.getBrandName();

  protected logout() {
    this.sdk.nuclia.auth.logout();
  }
}
