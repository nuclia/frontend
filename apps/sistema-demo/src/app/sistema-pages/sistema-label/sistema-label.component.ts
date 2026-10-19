import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PaDemoModule } from '@guillotinaweb/pastanaga-angular/demo';
import { LABEL_COLORS, LabelComponent } from '@nuclia/sistema';

@Component({
  templateUrl: './sistema-label.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PaDemoModule, RouterLink, LabelComponent],
})
export class SistemaLabelComponent {
  code = `<nsi-label [color]="LABEL_COLORS[0].mainColor">Blue label</nsi-label>`;

  colors = LABEL_COLORS;
}
