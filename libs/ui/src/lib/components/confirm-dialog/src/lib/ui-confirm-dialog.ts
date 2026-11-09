import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { HlmButtonImports } from '@nuclia/ui-spartan/button';
import { HlmDialogImports } from '@nuclia/ui-spartan/dialog';
import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';

export interface UiConfirmData {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
}

@Component({
  selector: 'ui-confirm-dialog',
  imports: [HlmButtonImports, HlmDialogImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grid gap-4' },
  template: `
    <hlm-dialog-header>
      <h2 hlmDialogTitle>{{ data.title }}</h2>
      @if (data.description) {
        <p hlmDialogDescription>{{ data.description }}</p>
      }
    </hlm-dialog-header>
    <hlm-dialog-footer>
      <button
        hlmBtn
        type="button"
        variant="outline"
        (click)="close(false)">
        {{ data.cancelLabel ?? 'Cancel' }}
      </button>
      <button
        hlmBtn
        type="button"
        [variant]="data.isDestructive ? 'destructive' : 'default'"
        (click)="close(true)">
        {{ data.confirmLabel ?? 'Confirm' }}
      </button>
    </hlm-dialog-footer>
  `,
})
export class UiConfirmDialog {
  private readonly _dialogRef = inject<BrnDialogRef<boolean>>(BrnDialogRef);
  protected readonly data = injectBrnDialogContext<UiConfirmData>();

  protected close(confirmed: boolean): void {
    this._dialogRef.close(confirmed);
  }
}
