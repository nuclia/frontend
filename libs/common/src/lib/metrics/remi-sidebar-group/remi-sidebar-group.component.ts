import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PaExpanderModule } from '@guillotinaweb/pastanaga-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { RemiDiagnosis } from '../remi-metrics.model';
import { RemiScoreDisplayComponent } from '../remi-score-display/remi-score-display.component';

@Component({
  selector: 'app-remi-sidebar-group',
  templateUrl: './remi-sidebar-group.component.html',
  styleUrl: './remi-sidebar-group.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RemiScoreDisplayComponent, PaExpanderModule, TranslatePipe],
})
export class RemiSidebarGroupComponent {
  diagnosis = input.required<RemiDiagnosis>();
  expandExpected = input(false);
}
