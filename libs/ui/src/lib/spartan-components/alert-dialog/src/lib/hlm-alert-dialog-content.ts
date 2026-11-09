import { Directive, inject, input } from '@angular/core';
import { BrnDialogRef } from '@spartan-ng/brain/dialog';
import { classes } from '@nuclia/ui-spartan/utils';

@Directive({
  selector: '[hlmAlertDialogContent],hlm-alert-dialog-content',
  exportAs: 'hlmAlertDialogContent',
  host: {
    'data-slot': 'alert-dialog-content',
    '[attr.data-state]': 'state()',
    '[attr.data-size]': 'size()',
  },
})
export class HlmAlertDialogContent {
  private readonly _dialogRef = inject(BrnDialogRef);
  public readonly state = this._dialogRef.state;

  public readonly size = input<'sm' | 'default'>('default');

  constructor() {
    classes(
      () =>
        'data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 bg-popover text-popover-foreground ring-foreground/10 gap-4 rounded-xl p-4 ring-1 duration-100 data-[size=default]:max-w-xs data-[size=sm]:max-w-xs data-[size=default]:sm:max-w-sm group/alert-dialog-content grid w-[calc(100vw-2rem)] outline-none',
    );
  }
}
