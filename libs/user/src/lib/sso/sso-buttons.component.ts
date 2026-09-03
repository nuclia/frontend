import { booleanAttribute, Component, Input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { SsoButtonComponent } from './sso-button.component';

@Component({
  selector: 'stf-sso-buttons',
  templateUrl: 'sso-buttons.component.html',
  styleUrls: ['./sso-buttons.component.scss'],
  imports: [TranslateModule, SsoButtonComponent],
})
export class SsoButtonsComponent {
  @Input({ transform: booleanAttribute }) separatorAfter = false;
  @Input({ transform: booleanAttribute }) compact = false;
}
