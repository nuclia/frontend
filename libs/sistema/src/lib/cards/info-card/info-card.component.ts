import { ChangeDetectionStrategy, Component, HostBinding, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'nsi-info-card',
  standalone: true,
  imports: [CommonModule],
  template: '<ng-content></ng-content>',
  styleUrl: './info-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InfoCardComponent {
  @Input() type: 'default' | 'warning' | 'highlight' = 'default';

  @HostBinding('class.warning') get warning() {
    return this.type === 'warning';
  }
  @HostBinding('class.highlight') get highlight() {
    return this.type === 'highlight';
  }
}
