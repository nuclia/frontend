import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostBinding,
  Input,
  Output,
} from '@angular/core';

import { BadgeComponent } from '../badge';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'nsi-two-columns-configuration-item',
  imports: [BadgeComponent, TranslateModule],
  templateUrl: './two-columns-configuration-item.component.html',
  styleUrl: './two-columns-configuration-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TwoColumnsConfigurationItemComponent {
  @Input() itemTitle = '';
  @Input() description = '';
  @Input() badge?: string;
  @Input({ transform: booleanAttribute }) noTopBorder = false;
  @Input({ transform: booleanAttribute }) unauthorized = false;

  @Output() clickOnUnauthorized = new EventEmitter<void>();

  @HostBinding('class.no-top-border') get topBorder() {
    return this.noTopBorder;
  }
}
