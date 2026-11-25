// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { BrnDrawerDescription } from '@spartan-ng/brain/drawer';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmDrawerDescription]',
  exportAs: 'hlmDrawerDescription',
  hostDirectives: [BrnDrawerDescription],
  host: { 'data-slot': 'drawer-description' },
})
export class HlmDrawerDescription {
  constructor() {
    classes(() => 'text-muted-foreground text-sm');
  }
}
