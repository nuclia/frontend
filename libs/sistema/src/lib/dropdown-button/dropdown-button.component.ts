import { booleanAttribute, ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Aspect,
  DropdownComponent,
  Kind,
  PaButtonModule,
  PaIconModule,
  PaPopupModule,
  Size,
} from '@guillotinaweb/pastanaga-angular';

@Component({
  selector: 'nsi-dropdown-button',
  standalone: true,
  imports: [CommonModule, PaButtonModule, PaIconModule, PaPopupModule],
  templateUrl: './dropdown-button.component.html',
  styleUrls: ['./dropdown-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DropdownButtonComponent {
  @Input() popupRef?: DropdownComponent;
  @Input() size: Size = 'medium';
  @Input() kind: Kind = 'secondary';
  @Input() aspect: Aspect = 'solid';
  @Input({ transform: booleanAttribute }) open = false;
  @Input({ transform: booleanAttribute }) disabled = false;
  @Input({ transform: booleanAttribute }) freeWidth = false;
  @Input({ transform: booleanAttribute }) fullWidth = false;
  @Input() icon?: string;
}
