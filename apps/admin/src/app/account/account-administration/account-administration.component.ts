import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FeaturesService } from '@flaps/core';
import { PaTabsModule } from '@guillotinaweb/pastanaga-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { AccountPageBase } from '../account-page-base';
import { AccountPageLayoutComponent } from '../account-page-layout/account-page-layout.component';

@Component({
  selector: 'app-account-administration',
  templateUrl: './account-administration.component.html',
  styleUrl: './account-administration.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AccountPageLayoutComponent, PaTabsModule, RouterLink, RouterLinkActive, AsyncPipe, TranslatePipe],
})
export class AccountAdministrationComponent extends AccountPageBase {
  private features = inject(FeaturesService);
  isAccountManager = this.features.isAccountManager;
  isRetrievalAgentsEnabled = this.features.unstable.retrievalAgents;
}
