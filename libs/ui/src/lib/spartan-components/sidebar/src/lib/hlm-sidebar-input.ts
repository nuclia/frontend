import { Directive } from '@angular/core';
import { HlmInput } from '@progress/pdp-ui-spartan/input';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: 'input[hlmSidebarInput]',
  exportAs: 'hlmSidebarInput',
  hostDirectives: [HlmInput],
  host: {
    'data-slot': 'sidebar-input',
    'data-sidebar': 'input',
  },
})
export class HlmSidebarInput {
  constructor() {
    classes(() => 'bg-background h-8 w-full shadow-none');
  }
}
