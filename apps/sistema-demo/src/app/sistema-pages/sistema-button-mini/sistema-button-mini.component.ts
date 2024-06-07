import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaDemoModule } from '../../../../../../libs/pastanaga-angular/projects/demo/src';
import { ButtonMiniComponent } from '@nuclia/sistema';

@Component({
  selector: 'nsd-sistema-button-mini',
  standalone: true,
  imports: [CommonModule, PaDemoModule, ButtonMiniComponent],
  templateUrl: './sistema-button-mini.component.html',
  styleUrl: './sistema-button-mini.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SistemaButtonMiniComponent {
  code = `<nsi-button-mini icon="edit">Edit</nsi-button-mini>`;
}
