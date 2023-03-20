import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SmallNavbarDirective } from '../../navbar';

@Component({
  selector: 'stf-dashboard-layout',
  templateUrl: './dashboard-layout.component.html',
  styleUrls: ['./dashboard-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardLayoutComponent extends SmallNavbarDirective {}
