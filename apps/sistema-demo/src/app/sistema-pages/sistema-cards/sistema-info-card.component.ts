import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaDemoModule } from '../../../../../../libs/pastanaga-angular/projects/demo/src';
import { InfoCardComponent } from '@nuclia/sistema';

@Component({
  selector: 'nsd-sistema-info-card',
  imports: [CommonModule, PaDemoModule, InfoCardComponent],
  templateUrl: './sistema-info-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SistemaInfoCardComponent {
  code = `<nsi-info-card>Any content, default style.</nsi-info-card>

<nsi-info-card type="highlight">Any content, highlight style.</nsi-info-card>

<nsi-info-card type="warning" icon="warning">Any content, warning style.</nsi-info-card>

<nsi-info-card icon="info">Any content, default style.</nsi-info-card>`;
}
