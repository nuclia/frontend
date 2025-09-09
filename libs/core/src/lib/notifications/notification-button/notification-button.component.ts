import { booleanAttribute, ChangeDetectionStrategy, Component, Input, numberAttribute } from '@angular/core';

import { PaButtonModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'stf-notification-button',
  imports: [PaButtonModule, TranslateModule],
  templateUrl: './notification-button.component.html',
  styleUrl: './notification-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationButtonComponent {
  @Input({ transform: booleanAttribute }) active = false;
  @Input({ transform: numberAttribute }) count?: number;
}
