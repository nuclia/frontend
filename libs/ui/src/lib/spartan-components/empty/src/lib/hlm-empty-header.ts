// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmEmptyHeader],hlm-empty-header',
  exportAs: 'hlmEmptyHeader',
  host: { 'data-slot': 'empty-header' },
})
export class HlmEmptyHeader {
  constructor() {
    classes(() => 'gap-2 flex max-w-sm flex-col items-center');
  }
}
