import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PaDemoModule } from '@guillotinaweb/pastanaga-angular/demo';
import { BackButtonComponent } from '@nuclia/sistema';

@Component({
  templateUrl: './sistema-back-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PaDemoModule, BackButtonComponent],
})
export class SistemaBackButtonComponent {
  code = `<nsi-back-button link="..">Back</nsi-back-button>`;
}
