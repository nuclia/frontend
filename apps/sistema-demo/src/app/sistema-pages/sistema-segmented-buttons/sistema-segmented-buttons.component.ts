import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaDemoModule } from '../../../../../../libs/pastanaga-angular/projects/demo/src';
import { SegmentedButtonsComponent } from '@nuclia/sistema';

@Component({
  selector: 'nsd-sistema-segmented-buttons',
  standalone: true,
  imports: [CommonModule, PaDemoModule, SegmentedButtonsComponent],
  templateUrl: './sistema-segmented-buttons.component.html',
  styleUrl: './sistema-segmented-buttons.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SistemaSegmentedButtonsComponent {
  active1 = '';
  active2: 'left' | 'right' = 'right';
  code = `<nsi-segmented-buttons
  leftButton="Left button"
  rightButton="Right button"
  (activeChange)="active1 = $event"></nsi-segmented-buttons>`;
  code2 = `<nsi-segmented-buttons
  leftButton="Left button"
  rightButton="Right button"
  [(active)]="active2"></nsi-segmented-buttons>`;
}
