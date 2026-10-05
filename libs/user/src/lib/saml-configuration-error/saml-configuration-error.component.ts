import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'nus-saml-configuration-error',
  templateUrl: './saml-configuration-error.component.html',
  styleUrls: ['./saml-configuration-error.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe],
})
export class SamlConfigurationErrorComponent {}