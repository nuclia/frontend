import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LABEL_COLORS } from '@nuclia/sistema';

@Component({
  templateUrl: './sistema-label.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class SistemaLabelComponent {
  code = `<nsi-label [color]="LABEL_COLORS[0].mainColor">Blue label</nsi-label>`;

  colors = LABEL_COLORS;
}
