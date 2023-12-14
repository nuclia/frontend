import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Counters } from '@nuclia/core';

@Component({
  selector: 'app-kb-metrics',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './kb-metrics.component.html',
  styleUrl: './kb-metrics.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KbMetricsComponent {
  @Input() metrics!: Counters | null;
  @Input() locale!: string;
}
