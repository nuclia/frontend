import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PaDemoModule } from '../../../../../../libs/pastanaga-angular/projects/demo/src/app/demo/demo.module';
import { BackButtonComponent } from '../../../../../../libs/sistema/src/lib/back-button/back-button.component';

@Component({
    templateUrl: './sistema-back-button.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [PaDemoModule, BackButtonComponent],
})
export class SistemaBackButtonComponent {
  code = `<nsi-back-button link="..">Back</nsi-back-button>`;
}
