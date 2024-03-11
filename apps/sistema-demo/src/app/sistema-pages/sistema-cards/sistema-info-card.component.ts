import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaDemoModule } from '../../../../../../libs/pastanaga-angular/projects/demo/src';
import { InfoCardComponent } from '@nuclia/sistema';

@Component({
  selector: 'nsd-sistema-info-card',
  standalone: true,
  imports: [CommonModule, PaDemoModule, InfoCardComponent],
  templateUrl: './sistema-info-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SistemaInfoCardComponent {
  code = `<nsi-info-card>Any content</nsi-info-card>`;
}
