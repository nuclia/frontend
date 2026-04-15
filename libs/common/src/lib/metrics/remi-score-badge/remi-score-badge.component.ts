import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { getRemiColorClass } from '../metrics-utils';

/**
 * Displays a single REMi score as a coloured pill badge.
 *
 * Usage:
 *   <app-remi-score-badge [value]="3.2" [label]="'metrics.remi.answer' | translate" />
 *
 * Renders nothing when value is null.
 * Colour tiers: low ≤2 (red), mid 2–4 (amber), high ≥4 (green).
 */
@Component({
  selector: 'app-remi-score-badge',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    @if (value() !== null) {
      <span
        class="remi-badge"
        [class.low]="colorClass() === 'low'"
        [class.mid]="colorClass() === 'mid'"
        [class.high]="colorClass() === 'high'">
        {{ label() }}: {{ value() | number: '1.1-1' }}
      </span>
    }
  `,
  styles: [
    `
      .remi-badge {
        display: inline-flex;
        align-items: center;
        padding: 2px 8px;
        border-radius: 4px;
        background: var(--color-neutral-lighter, #f0f0f0);
        font-size: 0.875rem;

        &.low {
          background: var(--color-danger-lightest);
          color: var(--color-danger-strong);
          font-weight: 600;
        }

        &.mid {
          background: var(--color-secondary-lightest);
          color: var(--color-secondary-strong);
          font-weight: 600;
        }

        &.high {
          background: var(--color-success-lightest);
          color: var(--color-success-strong);
          font-weight: 600;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RemiScoreBadgeComponent {
  readonly value = input<number | null>(null);
  readonly label = input('');

  readonly colorClass = computed(() => getRemiColorClass(this.value()));
}
