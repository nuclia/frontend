import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { HlmButtonImports } from '@nuclia/ui-spartan/button';

@Component({
  selector: 'app-subscription-delete',
  templateUrl: './subscription-delete.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  imports: [HlmButtonImports],
})
export class SubscriptionDeleteComponent {
  isDeleting = input.required<boolean>();
  confirmed = output<void>();

  protected showConfirm = signal(false);

  protected onConfirm() {
    this.confirmed.emit();
    this.showConfirm.set(false);
  }
}
