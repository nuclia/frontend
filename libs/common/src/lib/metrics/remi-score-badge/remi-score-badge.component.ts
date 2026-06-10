import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { getRemiScoreDisplay } from '../metrics-utils';

/**
 * Displays a single REMi score as a coloured pill badge.
 *
 * Usage:
 *   <app-remi-score-badge [value]="3.2" [label]="'metrics.remi.answer' | translate" />
 *
 * Always normalizes visible values to a 0-100 scale.
 */
@Component({
  selector: 'app-remi-score-badge',
  standalone: true,
  template: `
    <span
      class="remi-badge"
      [class.low]="display().status === 'poor'"
      [class.mid]="display().status === 'needs-review'"
      [class.high]="display().status === 'good'"
      [class.no-data]="display().status === 'no-data'">
      {{ label() }}: {{ display().displayValue }} · {{ display().label }}
    </span>
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

        &.no-data {
          background: var(--color-neutral-lightest, #f5f5f5);
          color: var(--color-neutral-regular, #737373);
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

  readonly display = computed(() => getRemiScoreDisplay(this.value()));
}
