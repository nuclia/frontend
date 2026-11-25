// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmCardContent]',
  exportAs: 'hlmCardContent',
  host: { 'data-slot': 'card-content' },
})
export class HlmCardContent {
  constructor() {
    classes(() => 'px-(--card-spacing)');
  }
}
