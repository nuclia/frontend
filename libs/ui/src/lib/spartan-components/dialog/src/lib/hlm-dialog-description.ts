import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';
import { BrnDialogDescription } from '@spartan-ng/brain/dialog';

@Directive({
  selector: '[hlmDialogDescription]',
  exportAs: 'hlmDialogDescription',
  hostDirectives: [BrnDialogDescription],
  host: { 'data-slot': 'dialog-description' },
})
export class HlmDialogDescription {
  constructor() {
    classes(() => 'text-muted-foreground *:[a]:hover:text-foreground text-sm *:[a]:underline *:[a]:underline-offset-3');
  }
}
