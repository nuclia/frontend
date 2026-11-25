// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnCommandSeparator } from '@spartan-ng/brain/command';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmCommandSeparator],hlm-command-separator',
  exportAs: 'hlmCommandSeparator',
  hostDirectives: [BrnCommandSeparator],
  host: {
    'data-slot': 'command-separator',
  },
})
export class HlmCommandSeparator {
  constructor() {
    classes(() => 'bg-border -mx-1 h-px block data-hidden:hidden');
  }
}
