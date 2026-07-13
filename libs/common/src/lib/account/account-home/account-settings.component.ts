import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FeaturesService } from '@flaps/core';
import { combineLatest, map, shareReplay } from 'rxjs';
import { AccountPageBase } from '../account-page-base';

@Component({
  selector: 'app-account-settings',
  templateUrl: './account-settings.component.html',
  styleUrl: './account-settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
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
}
