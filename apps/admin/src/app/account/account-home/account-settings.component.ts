import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FeaturesService } from '@flaps/core';
import { PaTabsModule } from '@guillotinaweb/pastanaga-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { combineLatest, map, shareReplay } from 'rxjs';
import { AccountPageBase } from '../account-page-base';
import { AccountPageLayoutComponent } from '../account-page-layout/account-page-layout.component';

@Component({
  selector: 'app-account-settings',
  templateUrl: './account-settings.component.html',
  styleUrl: './account-settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AccountPageLayoutComponent, PaTabsModule, RouterLink, RouterLinkActive, AsyncPipe, TranslatePipe],
})
export class AccountSettingsComponent extends AccountPageBase {
  private features = inject(FeaturesService);

  isCowork = this.sdk.currentAccount.pipe(
    map((account) => account.workflow === 'cowork'),
    shareReplay(1),
  );

  showAccountSettingsTab = combineLatest([this.features.isAccountManager, this.isCowork]).pipe(
    map(([isManager, isCowork]) => !!isManager && !isCowork),
    shareReplay(1),
  );

  showApiKeysTab = combineLatest([this.features.isAccountManager, this.isCowork]).pipe(
    map(([isManager, isCowork]) => !!isManager && isCowork),
    shareReplay(1),
  );
}
