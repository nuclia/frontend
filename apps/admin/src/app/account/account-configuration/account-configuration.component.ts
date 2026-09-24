import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FeaturesService } from '@flaps/core';
import { PaTabsModule } from '@guillotinaweb/pastanaga-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { AccountPageBase } from '../account-page-base';
import { AccountPageLayoutComponent } from '../account-page-layout/account-page-layout.component';

@Component({
  selector: 'app-account-configuration',
  templateUrl: './account-configuration.component.html',
  styleUrl: './account-configuration.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AccountPageLayoutComponent, PaTabsModule, RouterLink, RouterLinkActive, AsyncPipe, TranslatePipe],
})
export class AccountConfigurationComponent extends AccountPageBase {
  private features = inject(FeaturesService);
  isModelManagementEnabled = this.features.unstable.modelManagement;
  isNuaGuardManagementEnabled = this.features.unstable.nuaGuardsManagement;
}
