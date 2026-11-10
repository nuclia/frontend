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
  templateUrl: './confirm-dialog.component.html',
})
export class UiConfirmDialog {
  private readonly _dialogRef = inject<BrnDialogRef<boolean>>(BrnDialogRef);
  protected readonly data = injectBrnDialogContext<UiConfirmData>();

  protected close(confirmed: boolean): void {
    this._dialogRef.close(confirmed);
  }
}
