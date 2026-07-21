import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { PaButtonModule, PaIconModule, PaTranslateModule } from '@guillotinaweb/pastanaga-angular';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'nsi-back-button',
  imports: [RouterModule, PaTranslateModule, PaButtonModule, PaIconModule],
  templateUrl: './back-button.component.html',
  styleUrls: ['./back-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BackButtonComponent {
  @Input() link?: string | null;
}
