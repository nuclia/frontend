import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RemiDiagnosis } from '../remi-metrics.model';

@Component({
  standalone: false,
  selector: 'app-remi-sidebar-group',
  templateUrl: './remi-sidebar-group.component.html',
  styleUrl: './remi-sidebar-group.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RemiSidebarGroupComponent {
  diagnosis = input.required<RemiDiagnosis>();
  expandExpected = input(false);
}
