import { booleanAttribute, ChangeDetectionStrategy, Component, HostBinding, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BadgeComponent } from '../badge';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'nsi-two-columns-configuration-item',
  standalone: true,
  imports: [CommonModule, BadgeComponent, TranslateModule],
  templateUrl: './two-columns-configuration-item.component.html',
  styleUrl: './two-columns-configuration-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TwoColumnsConfigurationItemComponent {
  @Input() itemTitle = '';
  @Input() description = '';
  @Input() badge?: string;
  @Input({ transform: booleanAttribute }) noTopBorder = false;

  @HostBinding('class.no-top-border') get topBorder() {
    return this.noTopBorder;
  }
}
