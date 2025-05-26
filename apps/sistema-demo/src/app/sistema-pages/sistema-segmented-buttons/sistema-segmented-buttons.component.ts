import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SegmentedButtonsComponent } from '@nuclia/sistema';
import { PaDemoModule } from '../../../../../../libs/pastanaga-angular/projects/demo/src';

@Component({
  selector: 'nsd-sistema-segmented-buttons',
  imports: [CommonModule, PaDemoModule, SegmentedButtonsComponent],
  templateUrl: './sistema-segmented-buttons.component.html',
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
