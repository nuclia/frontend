import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { getRemiScoreDisplay } from '../remi-metrics.config';
import { RemiDisplayMode, RemiSourceScale } from '../remi-metrics.model';

@Component({
  selector: 'app-remi-score-display',
  imports: [TranslateModule],
  templateUrl: './remi-score-display.component.html',
  styleUrl: './remi-score-display.component.scss',
  host: {
    '[class]': 'hostClass()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RemiScoreDisplayComponent {
  private translate = inject(TranslateService);

  readonly value = input<number | null | undefined>(null);
  readonly displayMode = input<RemiDisplayMode>('full');
  readonly ariaLabel = input<string | null>(null);
  /** Optional metric label shown as a prefix (e.g. "Answer"). Used when replacing remi-score-badge. */
  readonly label = input<string>('');

  // Reserved for explicit normalization hints when needed by future metric variants.
  readonly sourceScale = input<RemiSourceScale>('auto');
  readonly metricType = input<string | null>(null);

  readonly display = computed(() => {
    // Track for future use — ensures this computed reacts when scale/type hints change
    void this.sourceScale();
    void this.metricType();
    return getRemiScoreDisplay(this.value());
  });

  readonly hostClass = computed(() => `${this.displayMode()} ${this.display().status}`);

  readonly fullAccessibleText = computed(() => {
    const display = this.display();
    const label = this.translate.instant(display.labelKey);
    return display.status === 'no-data' ? label : `${display.displayValue} · ${label}`;
  });

  readonly resolvedAriaLabel = computed(() => this.ariaLabel() ?? this.fullAccessibleText());

  readonly compactVisibleText = computed(() => {
    const display = this.display();
    return display.status === 'no-data' ? '—' : display.displayValue;
  });
}
