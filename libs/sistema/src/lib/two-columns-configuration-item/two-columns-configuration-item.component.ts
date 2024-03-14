import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'nsi-two-columns-configuration-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './two-columns-configuration-item.component.html',
  styleUrl: './two-columns-configuration-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TwoColumnsConfigurationItemComponent {
  @Input() itemTitle = '';
  @Input() description = '';
  @Input() label?: string;
}
