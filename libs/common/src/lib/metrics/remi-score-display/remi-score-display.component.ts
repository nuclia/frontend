import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { getRemiScoreDisplay } from '../metrics-utils';

type RemiDisplayMode = 'full' | 'compact' | 'badge';
type RemiSourceScale = 'auto' | '0-1' | '0-5' | '0-100';

@Component({
  selector: 'app-remi-score-display',
  standalone: true,
  template: `
    <span
      class="remi-score-display"
      [class.mode-full]="displayMode() === 'full'"
      [class.mode-compact]="displayMode() === 'compact'"
      [class.mode-badge]="displayMode() === 'badge'"
      [class.state-good]="display().status === 'good'"
      [class.state-needs-review]="display().status === 'needs-review'"
      [class.state-poor]="display().status === 'poor'"
      [class.state-no-data]="display().status === 'no-data'"
      [attr.title]="displayMode() === 'compact' ? fullAccessibleText() : null"
      [attr.aria-label]="resolvedAriaLabel()">
      @if (displayMode() === 'full') {
        {{ fullVisibleText() }}
      } @else if (displayMode() === 'compact') {
        {{ compactVisibleText() }}
      } @else {
        {{ badgeVisibleText() }}
      }
    </span>
  `,
  styles: [
    `
      .remi-score-display {
        display: inline-flex;
        align-items: center;
      }

      .mode-full,
      .mode-compact {
        font-weight: 600;
      }

      .mode-badge {
        border-radius: 999px;
        padding: 2px 8px;
        font-size: 12px;
        font-weight: 500;
        line-height: 1.2;
      }

      .state-good {
        color: var(--color-success-regular);
      }

      .mode-badge.state-good {
        color: var(--color-success-strong);
        background: var(--color-success-lightest);
      }

      .state-needs-review {
        color: var(--color-secondary-strong);
      }

      .mode-badge.state-needs-review {
        background: var(--color-secondary-lightest);
      }

      .state-poor {
        color: var(--color-danger-regular);
      }

      .mode-badge.state-poor {
        color: var(--color-danger-strong);
        background: var(--color-danger-lightest);
      }

      .state-no-data {
        color: var(--color-neutral-regular);
      }

      .mode-badge.state-no-data {
        background: var(--color-neutral-lightest);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RemiScoreDisplayComponent {
  readonly value = input<number | null | undefined>(null);
  readonly displayMode = input<RemiDisplayMode>('full');
  readonly ariaLabel = input<string | null>(null);

  // Reserved for explicit normalization hints when needed by future metric variants.
  readonly sourceScale = input<RemiSourceScale>('auto');
  readonly metricType = input<string | null>(null);

  readonly display = computed(() => {
    void this.sourceScale();
    void this.metricType();
    return getRemiScoreDisplay(this.value());
  });

  readonly fullAccessibleText = computed(() => {
    const display = this.display();
    return display.status === 'no-data' ? 'No data' : `${display.displayValue} · ${display.label}`;
  });

  readonly resolvedAriaLabel = computed(() => this.ariaLabel() ?? this.fullAccessibleText());

  readonly fullVisibleText = computed(() => this.fullAccessibleText());

  readonly compactVisibleText = computed(() => {
    const display = this.display();
    return display.status === 'no-data' ? '—' : display.displayValue;
  });

  readonly badgeVisibleText = computed(() => this.display().label);
}
