import { Component, inject } from '@angular/core';
import { BackendConfigurationService } from '@flaps/core';

@Component({
  selector: 'stf-user-container-logo',
  templateUrl: './user-container-logo.component.html',
  styleUrls: ['./user-container-logo.component.scss'],
  standalone: false,
})
export class UserContainerLogoComponent {
  private backendConfig = inject(BackendConfigurationService);
  assetsPath = this.backendConfig.getAssetsPath();
}
