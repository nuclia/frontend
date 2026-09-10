import { CommonModule } from '@angular/common';
import { booleanAttribute, ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { BrandService } from '@flaps/core';

@Component({
  selector: 'nus-user-container',
  templateUrl: './user-container.component.html',
  styleUrls: ['./user-container.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class UserContainerComponent {
  @Input({ transform: booleanAttribute }) alignLeft = false;
  private brandService = inject(BrandService);
  logoPath = this.brandService.logoPath;
  brandName = this.brandService.brandName;
}
