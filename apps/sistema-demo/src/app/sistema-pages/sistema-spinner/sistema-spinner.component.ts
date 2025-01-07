import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'nsd-sistema-spinner',
  templateUrl: './sistema-spinner.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class SistemaSpinnerComponent {
  codeSmall = `<nsi-spinner size="small"></nsi-spinner>`;
  codeMedium = `<nsi-spinner></nsi-spinner>
<nsi-spinner size="medium"></nsi-spinner>`;
  codeLarge = `<nsi-spinner size="large"></nsi-spinner>`;
}
