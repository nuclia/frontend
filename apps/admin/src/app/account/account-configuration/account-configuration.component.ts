import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FeaturesService } from '@flaps/core';
import { AccountPageBase } from '../account-page-base';

@Component({
  selector: 'app-account-configuration',
  templateUrl: './account-configuration.component.html',
  styleUrl: './account-configuration.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class AccountConfigurationComponent extends AccountPageBase {
  private features = inject(FeaturesService);
  isModelManagementEnabled = this.features.unstable.modelManagement;
}
