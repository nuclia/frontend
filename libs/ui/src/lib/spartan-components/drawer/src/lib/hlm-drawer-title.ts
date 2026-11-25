// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnDrawerTitle } from '@spartan-ng/brain/drawer';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmDrawerTitle]',
  exportAs: 'hlmDrawerTitle',
  hostDirectives: [BrnDrawerTitle],
  host: { 'data-slot': 'drawer-title' },
})
export class HlmDrawerTitle {
  constructor() {
    classes(() => 'text-foreground text-base font-medium');
  }
}
