import { Directive } from '@angular/core';
import { classes } from '@nuclia/ui-spartan/utils';

@Directive({
  selector: '[hlmDrawerFooter],hlm-drawer-footer',
  host: { 'data-slot': 'drawer-footer' },
})
export class HlmDrawerFooter {
  constructor() {
    classes(() => 'gap-2 p-4 mt-auto flex flex-col');
  }
}
