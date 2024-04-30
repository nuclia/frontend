import { ChangeDetectionStrategy, Component, HostBinding, Input, numberAttribute } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaTooltipModule } from '@guillotinaweb/pastanaga-angular';

@Component({
  selector: 'nsi-badge',
  standalone: true,
  imports: [CommonModule, PaTooltipModule],
  templateUrl: './badge.component.html',
  styleUrl: './badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeComponent {
  @Input({ transform: numberAttribute }) count?: number;
  @Input() kind: 'tertiary' | 'neutral' | 'success' = 'neutral';

  @HostBinding('class.overline') get overline() {
    return true;
  }
  @HostBinding('class.with-count') get hasCount() {
    return typeof this.count === 'number';
  }
  @HostBinding('class.tertiary') get tertiary() {
    return this.kind === 'tertiary';
  }
  @HostBinding('class.success') get success() {
    return this.kind === 'success';
  }
}
