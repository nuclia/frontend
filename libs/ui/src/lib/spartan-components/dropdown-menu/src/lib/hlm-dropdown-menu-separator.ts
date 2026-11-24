// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmDropdownMenuSeparator],hlm-dropdown-menu-separator',
  exportAs: 'hlmDropdownMenuSeparator',
  host: { 'data-slot': 'dropdown-menu-separator' },
})
export class HlmDropdownMenuSeparator {
  constructor() {
    classes(() => 'bg-border -mx-1 my-1 h-px block');
  }
}
