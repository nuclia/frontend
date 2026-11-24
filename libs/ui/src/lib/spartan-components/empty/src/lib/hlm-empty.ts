// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmEmpty],hlm-empty',
  exportAs: 'hlmEmpty',
  host: { 'data-slot': 'empty' },
})
export class HlmEmpty {
  constructor() {
    classes(
      () =>
        'gap-4 rounded-xl border-dashed p-6 flex w-full min-w-0 flex-1 flex-col items-center justify-center text-center text-balance',
    );
  }
}
