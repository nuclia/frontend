// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnSelectSeparator } from '@spartan-ng/brain/select';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmSelectSeparator],hlm-select-separator',
  exportAs: 'hlmSelectSeparator',
  hostDirectives: [{ directive: BrnSelectSeparator, inputs: ['orientation'] }],
  host: { 'data-slot': 'select-separator' },
})
export class HlmSelectSeparator {
  constructor() {
    classes(() => 'bg-border -mx-1 my-1 h-px pointer-events-none');
  }
}
