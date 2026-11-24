// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: 'kbd[hlmKbdGroup]',
  exportAs: 'hlmKbdGroup',
  host: {
    'data-slot': 'kbd-group',
  },
})
export class HlmKbdGroup {
  constructor() {
    classes(() => 'gap-1 inline-flex items-center');
  }
}
