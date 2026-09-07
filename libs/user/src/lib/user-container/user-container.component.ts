import { CommonModule } from '@angular/common';
import { booleanAttribute, ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { OAuthService } from '@flaps/core';

@Component({
  selector: 'nus-user-container',
  templateUrl: './user-container.component.html',
  styleUrls: ['./user-container.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class UserContainerComponent {
  @Input({ transform: booleanAttribute }) alignLeft = false;
  private oAuthService = inject(OAuthService);
  logoPath = this.oAuthService.cameFromLogo;
  brandName = this.oAuthService.cameFromBrandName;
}
