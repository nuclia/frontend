// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnSelectLabel } from '@spartan-ng/brain/select';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmSelectLabel],hlm-select-label',
  exportAs: 'hlmSelectLabel',
  hostDirectives: [{ directive: BrnSelectLabel, inputs: ['id'] }],
  host: { 'data-slot': 'select-label' },
})
export class HlmSelectLabel {
  constructor() {
    classes(() => 'text-muted-foreground px-1.5 py-1 text-xs flex');
  }
}
