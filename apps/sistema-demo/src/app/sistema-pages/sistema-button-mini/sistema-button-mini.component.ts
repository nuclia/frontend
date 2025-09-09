
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ButtonMiniComponent } from '@nuclia/sistema';
import { PaDemoModule } from '../../../../../../libs/pastanaga-angular/projects/demo/src';

@Component({
  selector: 'nsd-sistema-button-mini',
  imports: [PaDemoModule, ButtonMiniComponent],
  templateUrl: './sistema-button-mini.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SistemaButtonMiniComponent {
  code = `<nsi-button-mini icon="edit">Edit</nsi-button-mini>`;
}
