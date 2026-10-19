import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PaDemoModule } from '@guillotinaweb/pastanaga-angular/demo';
import { SpinnerComponent } from '@nuclia/sistema';

@Component({
  selector: 'nsd-sistema-spinner',
  templateUrl: './sistema-spinner.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PaDemoModule, SpinnerComponent],
})
export class SistemaSpinnerComponent {
  codeSmall = `<nsi-spinner size="small"></nsi-spinner>`;
  codeMedium = `<nsi-spinner></nsi-spinner>
<nsi-spinner size="medium"></nsi-spinner>`;
  codeLarge = `<nsi-spinner size="large"></nsi-spinner>`;
}
