import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PaDemoModule } from '../../../../../../libs/pastanaga-angular/projects/demo/src/app/demo/demo.module';
import { SpinnerComponent } from '../../../../../../libs/sistema/src/lib/progress/spinner/spinner.component';

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
