import { booleanAttribute, ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { BackendConfigurationService } from '@flaps/core';

@Component({
  selector: 'nus-user-container',
  templateUrl: './user-container.component.html',
  styleUrls: ['./user-container.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class UserContainerComponent {
  @Input({ transform: booleanAttribute }) alignLeft = false;
  private backendConfig = inject(BackendConfigurationService);
  logoPath = this.backendConfig.getLogoPath();
  brandName = this.backendConfig.getBrandName();
}
