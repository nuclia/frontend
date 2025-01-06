import { booleanAttribute, ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaCardModule, PaIconModule } from '@guillotinaweb/pastanaga-angular';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'nsi-action-card',
  imports: [CommonModule, PaCardModule, RouterLink, PaIconModule],
  templateUrl: './action-card.component.html',
  styleUrl: './action-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionCardComponent {
  @Input() tagLine?: string;
  @Input() title = '';
  @Input() description = '';
  @Input() textLink = '';
  @Input() navigateTo = '';
  @Input({ transform: booleanAttribute }) disabled = false;
}
