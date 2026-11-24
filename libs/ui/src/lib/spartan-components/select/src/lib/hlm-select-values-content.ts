// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmSelectValuesContent],hlm-select-values-content',
  exportAs: 'hlmSelectValuesContent',
})
export class HlmSelectValuesContent {
  constructor() {
    classes(() => 'gap-2 flex');
  }
}
