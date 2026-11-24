// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnCommand } from '@spartan-ng/brain/command';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmCommand],hlm-command',
  exportAs: 'hlmCommand',
  hostDirectives: [
    {
      directive: BrnCommand,
      inputs: ['id', 'filter', 'search', 'disabled'],
      outputs: ['valueChange', 'searchChange'],
    },
  ],
  host: {
    'data-slot': 'command',
  },
})
export class HlmCommand {
  constructor() {
    classes(
      () =>
        'bg-popover text-popover-foreground rounded-xl p-1 flex size-full flex-col overflow-hidden',
    );
  }
}
