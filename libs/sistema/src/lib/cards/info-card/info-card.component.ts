import { ChangeDetectionStrategy, Component, HostBinding, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaIconModule } from '@guillotinaweb/pastanaga-angular';

@Component({
  selector: 'nsi-info-card',
  imports: [CommonModule, PaIconModule],
  templateUrl: './info-card.component.html',
  styleUrl: './info-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InfoCardComponent {
  @Input() type: 'default' | 'warning' | 'highlight' = 'default';
  @Input() icon?: string;

  @HostBinding('class.warning') get warning() {
    return this.type === 'warning';
  }
  @HostBinding('class.highlight') get highlight() {
    return this.type === 'highlight';
  }
}
