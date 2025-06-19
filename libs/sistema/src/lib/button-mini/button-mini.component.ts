import { booleanAttribute, ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { PaIconModule, PaTooltipModule } from '@guillotinaweb/pastanaga-angular';

@Component({
  selector: 'nsi-button-mini',
  imports: [PaIconModule, PaTooltipModule],
  templateUrl: './button-mini.component.html',
  styleUrl: './button-mini.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonMiniComponent {
  @Input() icon?: string;
  @Input({ transform: booleanAttribute }) destructive = false;
  @Input({ transform: booleanAttribute }) disabled = false;
  @Input() help?: string;
}
