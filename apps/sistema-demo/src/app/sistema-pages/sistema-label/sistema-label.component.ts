import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LABEL_COLORS } from '@nuclia/sistema';
import { PaDemoModule } from '../../../../../../libs/pastanaga-angular/projects/demo/src/app/demo/demo.module';
import { RouterLink } from '@angular/router';
import { LabelComponent } from '../../../../../../libs/sistema/src/lib/label/label.component';

@Component({
    templateUrl: './sistema-label.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        PaDemoModule,
        RouterLink,
        LabelComponent,
    ],
})
export class SistemaLabelComponent {
  code = `<nsi-label [color]="LABEL_COLORS[0].mainColor">Blue label</nsi-label>`;

  colors = LABEL_COLORS;
}
