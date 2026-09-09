import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FeaturesService } from '@flaps/core';
import { AccountPageBase } from '../account-page-base';

@Component({
  selector: 'app-account-administration',
  templateUrl: './account-administration.component.html',
  styleUrl: './account-administration.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class AccountAdministrationComponent extends AccountPageBase {
  private features = inject(FeaturesService);
  isAccountManager = this.features.isAccountManager;
  isRetrievalAgentsEnabled = this.features.unstable.retrievalAgents;
}
