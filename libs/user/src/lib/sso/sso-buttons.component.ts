import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { SsoButtonComponent } from './sso-button.component';

@Component({
  selector: 'stf-sso-buttons',
  templateUrl: 'sso-buttons.component.html',
  styleUrls: ['./sso-buttons.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [TranslateModule, SsoButtonComponent],
})
export class SsoButtonsComponent {}
