// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmDropdownMenuShortcut],hlm-dropdown-menu-shortcut',
  exportAs: 'hlmDropdownMenuShortcut',
  host: { 'data-slot': 'dropdown-menu-shortcut' },
})
export class HlmDropdownMenuShortcut {
  constructor() {
    classes(
      () =>
        'text-muted-foreground group-focus/dropdown-menu-item:text-accent-foreground ms-auto text-xs tracking-widest',
    );
  }
}
