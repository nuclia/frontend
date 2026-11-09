import { SlicePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HlmButtonImports } from '@nuclia/ui-spartan/button';
import { HlmDialogImports } from '@nuclia/ui-spartan/dialog';
import { injectBrnDialogContext } from '@spartan-ng/brain/dialog';

@Component({
  templateUrl: './zone-token-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HlmButtonImports, HlmDialogImports, SlicePipe],
  host: { class: 'grid gap-4' },
})
export class ZoneTokenDialogComponent {
  protected readonly context = injectBrnDialogContext<{ token: string }>();
  protected readonly clipboardSupported = !!navigator.clipboard?.writeText;
  protected readonly copied = signal(false);

  protected copy(): void {
    navigator.clipboard.writeText(this.context.token);
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2000);
  }
}
