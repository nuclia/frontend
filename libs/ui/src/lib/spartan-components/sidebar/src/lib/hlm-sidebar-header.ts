import { Directive } from '@angular/core';
import { classes } from '@nuclia/ui-spartan/utils';

@Directive({
  selector: '[hlmSidebarHeader],hlm-sidebar-header',
  exportAs: 'hlmSidebarHeader',
  host: {
    'data-slot': 'sidebar-header',
    'data-sidebar': 'header',
  },
})
export class HlmSidebarHeader {
  constructor() {
    classes(() => 'gap-2 p-2 flex flex-col');
  }
}
