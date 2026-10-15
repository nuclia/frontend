import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { SsoButtonComponent } from './sso-button.component';

@Component({
  selector: 'stf-sso-buttons',
  templateUrl: 'sso-buttons.component.html',
  styleUrls: ['./sso-buttons.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [TranslatePipe, SsoButtonComponent],
})
export class SsoButtonsComponent {}
