import { Directive, input } from '@angular/core';
import { HlmButton, provideBrnButtonConfig } from '@progress/pdp-ui-spartan/button';
import { BrnDialogClose } from '@spartan-ng/brain/dialog';

@Directive({
  selector: 'button[hlmAlertDialogCancel]',
  exportAs: 'hlmAlertDialogCancel',
  providers: [provideBrnButtonConfig({ variant: 'outline' })],
  hostDirectives: [BrnDialogClose, { directive: HlmButton, inputs: ['variant', 'size'] }],
  host: { 'data-slot': 'alert-dialog-cancel', '[type]': 'type()' },
})
export class HlmAlertDialogCancel {
  public readonly type = input<'button' | 'submit' | 'reset'>('button');
}
