// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmCommandShortcut],hlm-command-shortcut',
  exportAs: 'hlmCommandShortcut',
  host: {
    'data-slot': 'command-shortcut',
  },
})
export class HlmCommandShortcut {
  constructor() {
    classes(
      () =>
        'text-muted-foreground group-data-[selected]/command-item:text-foreground ms-auto text-xs tracking-widest',
    );
  }
}
