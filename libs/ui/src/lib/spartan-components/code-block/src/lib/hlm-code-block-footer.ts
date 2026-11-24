// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Directive } from '@angular/core';
import { classes } from '@progress/pdp-ui-spartan/utils';

@Directive({
  selector: '[hlmCodeBlockFooter],hlm-code-block-footer',
  exportAs: 'hlmCodeBlockFooter',
  host: { 'data-slot': 'code-block-footer' },
})
export class HlmCodeBlockFooter {
  constructor() {
    classes(
      () =>
        'text-muted-foreground gap-2 px-3 pb-3 group-data-[size=sm]/code-block:px-2.5 group-data-[size=sm]/code-block:pb-2.5 flex min-w-0 shrink-0 items-center',
    );
  }
}
